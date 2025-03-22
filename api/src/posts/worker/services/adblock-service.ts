import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import { firstValueFrom } from 'rxjs';
import { CacheService } from './cache';

// Standard EasyList sources only
const BLOCKLIST_URLS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
  'https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-online.txt',
  'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=1&mimetype=plaintext'
];

const CACHE_KEY = 'adblock-filters';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

@Injectable()
export class AdBlockService implements OnModuleInit {
  private readonly logger = new Logger(AdBlockService.name);
  private blocker: PlaywrightBlocker | null = null;
  private isInitialized = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  /**
   * Initialize the adblocker with blocklists.
   * This method ensures the blocker is only initialized once.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.log('Initializing adblocker...');
      
      // First set an empty blocker to ensure something is available
      this.blocker = PlaywrightBlocker.empty();
      
      // Then try to load from EasyList
      const filterText = await this.getFilterText();
      if (filterText) {
        try {
          this.blocker = await PlaywrightBlocker.parse(filterText);
          this.logger.log('Adblocker filters loaded successfully');
        } catch (error) {
          this.logger.error(`Failed to create blocker from lists: ${error.message}`);
          // Keep the empty blocker created above
        }
      }
      
      this.isInitialized = true;
      this.logger.log('Adblocker initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize adblocker: ${error.message}`);
      
      // Ensure we have a minimal engine to avoid breaking the app
      if (!this.blocker) {
        this.blocker = PlaywrightBlocker.empty();
      }
    }
  }

  /**
   * Get the configured blocker instance.
   * If not initialized, it will initialize first.
   */
  async getBlocker(): Promise<PlaywrightBlocker> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.blocker;
  }

  /**
   * Get the filter text from cache or remote sources
   */
  private async getFilterText(): Promise<string> {
    try {
      // Use CacheService to fetch or update the filter text
      return await this.cacheService.getOrFetch<string>(
        CACHE_KEY,
        () => this.fetchBlocklists(),
        {
          expirationMs: CACHE_EXPIRATION,
          subDirectory: 'adblock'
        }
      );
    } catch (error) {
      this.logger.error(`Failed to get filter text: ${error.message}`);
      return ''; // Return empty string on error
    }
  }
  
  /**
   * Fetch blocklists from remote sources
   */
  private async fetchBlocklists(): Promise<string> {
    this.logger.log('Fetching blocklists from remote sources...');
    
    try {
      // Fetch all blocklists
      const blocklists = await Promise.all(
        BLOCKLIST_URLS.map(async (url) => {
          try {
            const response = await firstValueFrom(this.httpService.get(url, {
              headers: {
                'User-Agent': USER_AGENT
              }
            }));
            return response.data;
          } catch (error) {
            this.logger.warn(`Failed to fetch blocklist from ${url}: ${error.message}`);
            return '';
          }
        })
      );
      
      // Filter out empty responses and combine all blocklists
      const validBlocklists = blocklists.filter(list => !!list);
      const blocklist = validBlocklists.join('\n');
      
      if (!blocklist) {
        throw new Error('No valid blocklists were fetched');
      }
      
      this.logger.log('Blocklists fetched successfully');
      return blocklist;
    } catch (error) {
      this.logger.error(`Failed to fetch blocklists: ${error.message}`);
      throw error;
    }
  }
} 