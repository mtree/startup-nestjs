import { Injectable, Logger } from '@nestjs/common';
import { Browser, chromium, Page } from 'playwright';

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
}

export interface CrawlOptions {
  debugMode?: boolean;
  timeout?: number;
  retries?: number;
  initialBackoffTime?: number;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly defaultUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
  ];

  /**
   * Crawl a URL using Playwright with stealth techniques and optimizations
   */
  async crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const {
      debugMode = false,
      timeout = 30000,
      retries = 3,
      initialBackoffTime = 1000
    } = options;

    let browser: Browser = null;
    let page: Page = null;
    let attemptsLeft = retries;
    let backoffTime = initialBackoffTime;
    
    while (attemptsLeft > 0) {
      try {
        const userAgent = this.getRandomUserAgent();
        
        // Setup and configure browser
        browser = await this.setupBrowser(debugMode);
        const context = await this.createStealthContext(browser, userAgent);
        page = await this.createOptimizedPage(context);
        
        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle', timeout });
        
        // Extract data from the page
        const result = await this.extractPageData(page, debugMode);
        
        // Clean up
        await browser.close();
        
        return result;
      } catch (error) {
        this.logger.warn(`Crawling attempt failed: ${error.message}. Retries left: ${attemptsLeft - 1}`);
        
        if (browser) {
          await browser.close();
        }
        
        if (--attemptsLeft <= 0) {
          throw new Error(`Failed to crawl after multiple attempts: ${error.message}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        backoffTime *= 2; // Double the backoff time for next attempt
      }
    }

    throw new Error('Failed to crawl URL after all retry attempts');
  }

  private getRandomUserAgent(): string {
    const index = Math.floor(Math.random() * this.defaultUserAgents.length);
    return this.defaultUserAgents[index];
  }

  private async setupBrowser(debugMode: boolean): Promise<Browser> {
    return chromium.launch({ 
      headless: !debugMode,
    });
  }

  private async createStealthContext(browser: Browser, userAgent: string) {
    return browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
    });
  }

  private async createOptimizedPage(context: any) {
    const page = await context.newPage();
    
    // Block unnecessary resources
    await page.route('**/*.{png,jpg,jpeg,gif,svg,pdf,woff,woff2,ttf,otf}', route => {
      route.abort();
    });
    
    // Continue with CSS for better rendering
    await page.route('**/*.css', route => route.continue());
    
    // Block common analytics and ad scripts
    await page.route(/(google-analytics|googletagmanager|adservices|adsense|doubleclick|facebook|twitter)/i, 
      route => route.abort()
    );

    // Set extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'DNT': '1', // Do Not Track
    });

    return page;
  }

  private async extractPageData(page: Page, debugMode: boolean): Promise<CrawlResult> {
    const title = await page.title();
    const content = await page.content();
    
    const metadata = await page.evaluate(() => {
      const getMetaTag = (name) => {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element ? element.getAttribute('content') : null;
      };
      
      return {
        title: document.title,
        description: getMetaTag('description') || getMetaTag('og:description'),
        image: getMetaTag('og:image'),
        author: getMetaTag('author'),
        keywords: getMetaTag('keywords'),
        mainText: document.body.innerText.substring(0, 1000) // First 1000 chars of text
      };
    });
    
    // Take screenshot for debugging
    if (debugMode) {
      await page.screenshot({ path: `debug-${Date.now()}.png` });
    }
    
    return { 
      title, 
      metadata,
      content: debugMode ? content : undefined // Only include full content in debug mode
    };
  }
} 