import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { AdBlockService } from './adblock-service';
import { Request } from '@ghostery/adblocker';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface CrawlResult {
  title: string;
  metadata: {
    title: string;
    description: string;
    image: string;
    author: string;
    keywords: string;
    mainText: string;
  };
  readability?: {
    title: string;
    byline: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    siteName: string;
  };
  content?: string;
  matchedAdblockFiltersCount: number;
  blockedResourcesCount: number;
}

export interface CrawlOptions {
  debugMode?: boolean;
  timeout?: number;
  retries?: number;
}

const BLOCKABLE_RESOURCE_TYPES = ['image', 'font', 'media', 'stylesheet'];

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  constructor(private readonly adBlockService: AdBlockService) {}

  /**
   * Crawl a URL using Playwright with adblocking and performance optimizations
   */
  async crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const { debugMode = false, timeout = 30000, retries = 1 } = options;
    
    let context: BrowserContext = null;
    let browser: Browser = null;
    let matchedFiltersCount = 0;
    let blockedResourcesCount = 0;
    
    try {
      // Launch browser with optimized settings
      browser = await chromium.launch({ 
        headless: !debugMode,
      });
      
      // Create optimized context
      context = await browser.newContext({
        userAgent: this.userAgent,
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        bypassCSP: true, // Bypass Content-Security-Policy to ensure page loads
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        serviceWorkers: 'block',
      });

      // Create a new page
      const page = await context.newPage();
      

      // Apply adblocking
      const blocker = await this.adBlockService.getBlocker();
      await blocker.enableBlockingInPage(page);

      // Apply resource blocking
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        const resourceType = route.request().resourceType();
        
        // Handle direct resource type matching
        if (BLOCKABLE_RESOURCE_TYPES.includes(resourceType)) {
          this.logger.debug(`Blocked ${resourceType}: ${url}`);
          blockedResourcesCount++;
          return route.abort();
        }
        
        // Handle ambiguous 'other' resource types
        if (resourceType === 'other') {
          const blockableRequest = Request.fromRawDetails({
            url,
            type: 'other',
            sourceUrl: page.url(),
          });
          
          const guessedType = blockableRequest.guessTypeOfRequest();
          if (BLOCKABLE_RESOURCE_TYPES.includes(guessedType)) {
            this.logger.debug(`Blocked (guessed ${guessedType}): ${url}`);
            blockedResourcesCount++;
            return route.abort();
          }
        }
        
        // Allow all other resources
        return route.continue();
      });

      // Track blocked requests
      blocker.on('filter-matched', (request) => {
        matchedFiltersCount++;

      });

      // Set timeouts and optimized navigation settings
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);

      // Navigate with optimized settings
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster than 'networkidle'
        timeout 
      });
      
      // Extract page data
      const result = await this.extractPageData(page, debugMode);
      
      // Add blocked requests count to the result
      result.matchedAdblockFiltersCount = matchedFiltersCount;
      result.blockedResourcesCount = blockedResourcesCount;
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to crawl URL ${url}: ${error.message}`);
      
      // Try retry if configured
      if (retries > 1) {
        this.logger.log(`Retrying URL ${url}, ${retries-1} attempts left`);
        return this.crawlUrl(url, { ...options, retries: retries - 1 });
      }
      
      throw error;
    } finally {
      // Always close the browser
      if (browser) {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
      }
    }
  }

  private async extractPageData(page: Page, debugMode: boolean): Promise<CrawlResult> {
    const title = await page.title();
    const htmlContent = await page.content();
    
    // Get metadata via a single evaluation call (more efficient)
    const metadata = await page.evaluate(() => {
      const getMetaTag = (name) => {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element ? element.getAttribute('content') : '';
      };
      
      return {
        title: document.title,
        description: getMetaTag('description') || getMetaTag('og:description') || '',
        image: getMetaTag('og:image') || '',
        author: getMetaTag('author') || '',
        keywords: getMetaTag('keywords') || '',
        mainText: document.body.innerText.substring(0, 1000) || ''
      };
    });
    
    // Process page with Readability
    const readabilityResult = await this.extractReadableContent(htmlContent);
    
    // Debug snapshot if needed
    if (debugMode) {
      await page.screenshot({ path: `debug-${Date.now()}.png` });
      return { 
        title, 
        metadata,
        readability: readabilityResult,
        content: htmlContent,
        matchedAdblockFiltersCount: 0, // Will be updated in the main method
        blockedResourcesCount: 0 // Will be updated in the main method
      };
    }
    
    return { 
      title, 
      metadata,
      readability: readabilityResult,
      content: undefined, 
      matchedAdblockFiltersCount: 0, // Will be updated in the main method
      blockedResourcesCount: 0 // Will be updated in the main method
    };
  }

  /**
   * Extract content using Readability
   * @param html The HTML content to process
   * @returns Processed content from Readability
   */
  private extractReadableContent(html: string) {
    try {
      const dom = new JSDOM(html);
      const reader = new Readability(dom.window.document);
      const result = reader.parse();
      
      if (!result) {
        this.logger.warn('Readability could not parse the page content');
        return null;
      }
      
      return {
        title: result.title,
        byline: result.byline,
        content: result.content,
        textContent: result.textContent,
        length: result.length,
        excerpt: result.excerpt,
        siteName: result.siteName
      };
    } catch (error) {
      this.logger.error(`Readability extraction error: ${error.message}`);
      return null;
    }
  }
} 