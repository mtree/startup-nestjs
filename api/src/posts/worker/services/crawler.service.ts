import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { AdBlockService } from './adblock-service';
import { Request } from '@ghostery/adblocker';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { UnrecoverableError } from 'bullmq';
import { NON_RETRIABLE_ERROR_CODES } from '../utils/error-utils';

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
  success: boolean;
  errorMessage?: string;
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
const DEFAULT_METADATA: MetadataResult = {
  title: '',
  description: '',
  image: '',
  author: '',
  keywords: '',
  mainText: ''
};

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
    
    // Use an object to track counters so they're passed by reference
    const counters = {
      matchedFiltersCount: 0,
      blockedResourcesCount: 0
    };
    
    try {
      // Setup browser and page
      ({ browser, context } = 
        await this.setupBrowserAndPage(url, timeout, debugMode));
      
      const page = await context.newPage();
      
      // Set up adblocking and resource filtering
      await this.setupAdblocking(page, counters);
      
      // Configure navigation timeouts
      this.configureTimeouts(page, timeout);
      
      // Navigate to the page
      await this.navigateToPage(page, url, timeout);
      
      // Extract page data
      const result = await this.extractPageData(page, debugMode);
      
      // Add blocked requests stats to the result
      result.matchedAdblockFiltersCount = counters.matchedFiltersCount;
      result.blockedResourcesCount = counters.blockedResourcesCount;
      result.success = true;
      
      // Log counter values
      this.logger.log(`Crawl completed for ${url}. Filter matches: ${counters.matchedFiltersCount}, Blocked resources: ${counters.blockedResourcesCount}`);
      
      return result;
    } catch (error) {
      // Even for errors, we want to include any counter data we collected
      const errorResult = await this.handleCrawlError(error, url, options);
      
      // Add counter data to the error result too
      errorResult.matchedAdblockFiltersCount = counters.matchedFiltersCount;
      errorResult.blockedResourcesCount = counters.blockedResourcesCount;
      
      return errorResult;
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
    debugMode: boolean
  ): Promise<{ 
    browser: Browser; 
    context: BrowserContext;
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
      context
    };
  }

  /**
   * Configure adblocking and resource filtering for the page
   */
  private async setupAdblocking(
    page: Page,
    counters: { matchedFiltersCount: number, blockedResourcesCount: number }
  ): Promise<void> {
    // Apply adblocking
    const blocker = await this.adBlockService.getBlocker();
    
    // Enable blocking in page
    this.logger.log(`Setting up adblocking for page - blocker available: ${!!blocker}`);
    await blocker.enableBlockingInPage(page);
    
    this.logger.log(`Adblocking initialized. Blocking resource types: ${BLOCKABLE_RESOURCE_TYPES.join(', ')}`);

    // Apply resource blocking
    let routeCounter = 0;
    await page.route('**/*', async (route) => {
      routeCounter++;
      const url = route.request().url();
      const resourceType = route.request().resourceType();
      
      // Handle direct resource type matching
      if (BLOCKABLE_RESOURCE_TYPES.includes(resourceType)) {
        this.logger.debug(`[${routeCounter}] Blocked ${resourceType}: ${url.substring(0, 100)}`);
        counters.blockedResourcesCount++;
        return route.abort();
      }
      
      // Handle ambiguous 'other' resource types
      if (resourceType === 'other') {
        try {
          const blockableRequest = Request.fromRawDetails({
            url,
            type: 'other',
            sourceUrl: page.url(),
          });
          
          const guessedType = blockableRequest.guessTypeOfRequest();
          if (BLOCKABLE_RESOURCE_TYPES.includes(guessedType)) {
            this.logger.log(`[${routeCounter}] Blocked (guessed ${guessedType}): ${url.substring(0, 100)}`);
            counters.blockedResourcesCount++;
            return route.abort();
          }
        } catch (error) {
          this.logger.debug(`Error guessing resource type: ${error.message}`);
        }
      }
      
      // Log allowed resources for debugging
      this.logger.debug(`[${routeCounter}] Allowed ${resourceType}: ${url.substring(0, 100)}`);
      
      // Allow all other resources
      return route.continue();
    });

    // Track blocked requests with detailed logging
    let matchCounter = 0;
    blocker.on('filter-matched', (matchInfo) => {
      matchCounter++;
      counters.matchedFiltersCount++;
      // Log details about matched filter - type is specific to @ghostery/adblocker
      const filterText = matchInfo?.filter?.toString() || 'unknown';
      this.logger.debug(`[${matchCounter}] Adblock filter matched: ${filterText}`);
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
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Faster than 'networkidle'
        timeout 
      });
    } catch (error) {
      // Log the detailed error once at the source with all context
      this.logger.error(`Navigation failed for ${url}: ${error.message}`, {
        url,
        errorType: error.name,
        errorDetails: error.message
      });
      
      // Check if this is a non-retriable error
      if (NON_RETRIABLE_ERROR_CODES.some(code => error.message?.includes(code))) {
        this.logger.warn(`Non-retriable network error detected, skipping retries: ${url}`);
        throw new UnrecoverableError(`Navigation failed for ${url}: ${error.message}`);
      }
      
      // For other errors, just pass through
      throw error;
    }
  }

  /**
   * Handle errors during crawling, including retry logic
   */
  private async handleCrawlError(
    error: Error, 
    url: string, 
    options: CrawlOptions
  ): Promise<CrawlResult> {
    // Check if this is already an UnrecoverableError (from navigateToPage)
    const isUnrecoverable = error instanceof UnrecoverableError;
    
    // Log with appropriate context based on error type
    if (isUnrecoverable) {
      this.logger.warn(`Crawl failed with unrecoverable error for ${url}, skipping retries`);
    } else if (options.retries > 1) {
      this.logger.warn(`Crawl failed for ${url} (will retry)`);
    } else {
      this.logger.warn(`Crawl failed for ${url} (no more retries)`);
    }
    
    // Don't retry if it's an UnrecoverableError or we're out of retries
    if (isUnrecoverable || options.retries <= 1) {
      return {
        title: `Failed to load: ${url}`,
        metadata: DEFAULT_METADATA,
        matchedAdblockFiltersCount: 0,
        blockedResourcesCount: 0,
        success: false,
        errorMessage: error.message || `Failed to load: ${url}`
      };
    }
    
    // Try retry if configured
    this.logger.log(`Retrying URL ${url}, ${options.retries-1} attempts left`);
    return this.crawlUrl(url, { 
      ...options, 
      retries: options.retries - 1 
    });
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
    // Add a small delay to ensure all resources are properly counted
    await page.waitForTimeout(500);
    
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
        blockedResourcesCount: 0, // Will be updated in the main method
        success: true
      };
    }
    
    return { 
      title, 
      metadata,
      readability: readabilityResult,
      content: undefined, 
      matchedAdblockFiltersCount: 0, // Will be updated in the main method
      blockedResourcesCount: 0, // Will be updated in the main method
      success: true
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