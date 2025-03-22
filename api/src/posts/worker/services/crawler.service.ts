import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { AdBlockService } from './adblock-service';
import { Request } from '@ghostery/adblocker';

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
  content?: string;
  matchedAdblockFiltersCount: number;
}

export interface CrawlOptions {
  debugMode?: boolean;
  timeout?: number;
  retries?: number;
}

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
        const blockableResourceTypes = ['image', 'font', 'media', 'stylesheet'];
        
        // Handle direct resource type matching
        if (blockableResourceTypes.includes(resourceType)) {
          this.logger.log(`Blocked ${resourceType}: ${url}`);
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
          if (blockableResourceTypes.includes(guessedType)) {
            this.logger.log(`Blocked (guessed ${guessedType}): ${url}`);
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
    
    // Debug snapshot if needed
    if (debugMode) {
      await page.screenshot({ path: `debug-${Date.now()}.png` });
      return { 
        title, 
        metadata,
        content: await page.content(),
        matchedAdblockFiltersCount: 0 // Will be updated in the main method
      };
    }
    
    return { 
      title, 
      metadata,
      content: undefined, 
      matchedAdblockFiltersCount: 0 // Will be updated in the main method
    };
  }
} 