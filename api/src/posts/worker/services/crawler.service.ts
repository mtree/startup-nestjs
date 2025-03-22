import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { AdBlockService } from './adblock-service';
import { Request } from '@ghostery/adblocker';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

// Interfaces
export interface MetadataResult {
  title: string;
  description: string;
  image: string;
  author: string;
  keywords: string;
  mainText: string;
}

export interface ReadabilityResult {
  title: string;
  byline: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  siteName: string;
}

export interface CrawlResult {
  title: string;
  metadata: MetadataResult;
  readability?: ReadabilityResult;
  content?: string;
  matchedAdblockFiltersCount: number;
  blockedResourcesCount: number;
}

export interface CrawlOptions {
  debugMode?: boolean;
  timeout?: number;
  retries?: number;
}

// Constants
const BLOCKABLE_RESOURCE_TYPES = ['image', 'font', 'media', 'stylesheet'];
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 1;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly userAgent = DEFAULT_USER_AGENT;

  constructor(private readonly adBlockService: AdBlockService) {}

  /**
   * Crawl a URL using Playwright with adblocking and performance optimizations
   * @param url The URL to crawl
   * @param options Crawl configuration options
   * @returns Processed page data including metadata and readable content
   */
  async crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const { 
      debugMode = false, 
      timeout = DEFAULT_TIMEOUT, 
      retries = DEFAULT_RETRIES 
    } = options;
    
    let context: BrowserContext = null;
    let browser: Browser = null;
    let matchedFiltersCount = 0;
    let blockedResourcesCount = 0;
    
    try {
      // Setup browser and page
      ({ browser, context, matchedFiltersCount, blockedResourcesCount } = 
        await this.setupBrowserAndPage(url, timeout, debugMode, matchedFiltersCount, blockedResourcesCount));
      
      const page = await context.newPage();
      
      // Set up adblocking and resource filtering
      await this.setupAdblocking(page, blockedResourcesCount, matchedFiltersCount);
      
      // Configure navigation timeouts
      this.configureTimeouts(page, timeout);
      
      // Navigate to the page
      await this.navigateToPage(page, url, timeout);
      
      // Extract page data
      const result = await this.extractPageData(page, debugMode);
      
      // Add blocked requests stats to the result
      result.matchedAdblockFiltersCount = matchedFiltersCount;
      result.blockedResourcesCount = blockedResourcesCount;
      
      return result;
    } catch (error) {
      return this.handleCrawlError(error, url, options);
    } finally {
      // Clean up resources
      await this.cleanupBrowserResources(browser, context);
    }
  }

  /**
   * Set up the browser and create a context
   */
  private async setupBrowserAndPage(
    url: string, 
    timeout: number, 
    debugMode: boolean,
    matchedFiltersCount: number,
    blockedResourcesCount: number
  ): Promise<{ 
    browser: Browser; 
    context: BrowserContext; 
    matchedFiltersCount: number;
    blockedResourcesCount: number;
  }> {
    // Launch browser with optimized settings
    const browser = await chromium.launch({ 
      headless: !debugMode,
    });
    
    // Create optimized context with appropriate settings
    const context = await browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      bypassCSP: true, // Bypass Content-Security-Policy to ensure page loads
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      serviceWorkers: 'block',
    });

    return { 
      browser, 
      context, 
      matchedFiltersCount, 
      blockedResourcesCount 
    };
  }

  /**
   * Configure adblocking and resource filtering for the page
   */
  private async setupAdblocking(
    page: Page, 
    blockedResourcesCount: number,
    matchedFiltersCount: number
  ): Promise<void> {
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
    blocker.on('filter-matched', () => {
      matchedFiltersCount++;
    });
  }

  /**
   * Configure page timeouts
   */
  private configureTimeouts(page: Page, timeout: number): void {
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);
  }

  /**
   * Navigate to the target URL with optimized settings
   */
  private async navigateToPage(page: Page, url: string, timeout: number): Promise<void> {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', // Faster than 'networkidle'
      timeout 
    });
  }

  /**
   * Handle errors during crawling, including retry logic
   */
  private async handleCrawlError(
    error: Error, 
    url: string, 
    options: CrawlOptions
  ): Promise<CrawlResult> {
    this.logger.error(`Failed to crawl URL ${url}: ${error.message}`);
    
    // Try retry if configured
    if (options.retries > 1) {
      this.logger.log(`Retrying URL ${url}, ${options.retries-1} attempts left`);
      return this.crawlUrl(url, { 
        ...options, 
        retries: options.retries - 1 
      });
    }
    
    throw error;
  }

  /**
   * Clean up browser resources
   */
  private async cleanupBrowserResources(
    browser: Browser, 
    context: BrowserContext
  ): Promise<void> {
    if (browser) {
      await context?.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }

  /**
   * Extract metadata and content from the page
   */
  private async extractPageData(page: Page, debugMode: boolean): Promise<CrawlResult> {
    const title = await page.title();
    const htmlContent = await page.content();
    
    // Extract metadata
    const metadata = await this.extractMetadata(page);
    
    // Process page with Readability
    const readabilityResult = await this.extractReadableContent(htmlContent);
    
    // Create result object with conditional debug information
    return this.createResultObject(title, metadata, readabilityResult, htmlContent, debugMode, page);
  }

  /**
   * Extract metadata from page using DOM
   */
  private async extractMetadata(page: Page): Promise<MetadataResult> {
    return page.evaluate(() => {
      const getMetaTag = (name: string): string => {
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
  }

  /**
   * Create the final result object with appropriate debugging information
   */
  private async createResultObject(
    title: string,
    metadata: MetadataResult,
    readabilityResult: ReadabilityResult,
    htmlContent: string,
    debugMode: boolean,
    page: Page
  ): Promise<CrawlResult> {
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
  private extractReadableContent(html: string): ReadabilityResult | null {
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