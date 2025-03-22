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
  private filtersCount = 0;

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
          this.logger.log(`Creating blocker with filter text of length: ${filterText.length} bytes`);
          const lines = filterText.split('\n').length;
          this.logger.log(`Filter text contains ${lines} lines`);
          
          this.blocker = await PlaywrightBlocker.parse(filterText);
          
          // Count the filters to verify they were loaded
          const filters = this.blocker.getFilters();
          this.filtersCount = filters.networkFilters.length + filters.cosmeticFilters.length;
          this.logger.log(`Adblocker loaded ${this.filtersCount} filters successfully (${filters.networkFilters.length} network, ${filters.cosmeticFilters.length} cosmetic)`);
          
          if (this.filtersCount === 0) {
            this.logger.warn('No filters were loaded - proceeding with empty blocker');
            this.blocker = PlaywrightBlocker.empty(); // Reset to empty blocker
            await this.cacheService.clear(CACHE_KEY); // Clear the cache to try again next time
          }
        } catch (error) {
          this.logger.error(`Failed to create blocker from lists: ${error.message}`);
          // Keep the empty blocker created above
        }
      } else {
        this.logger.warn('No filter text was loaded - proceeding with empty blocker');
      }
      
      this.isInitialized = true;
      this.logger.log(`Adblocker initialized with ${this.filtersCount} filters`);
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
    
    // Log the number of active filters
    this.logger.log(`Returning blocker with ${this.filtersCount} filters`);
    return this.blocker;
  }

  /**
   * Get the filter text from cache or remote sources
   */
  private async getFilterText(): Promise<string> {
    try {
      // Use CacheService to fetch or update the filter text
      const result = await this.cacheService.getOrFetch<string>(
        CACHE_KEY,
        () => this.fetchBlocklists(),
        {
          expirationMs: CACHE_EXPIRATION,
          subDirectory: 'adblock'
        }
      );
      
      this.logger.log(`Retrieved filter text: ${result ? 'yes' : 'no'}, length: ${result?.length || 0} bytes`);
      return result;
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
              },
              timeout: 10000 // 10 second timeout
            }));
            this.logger.log(`Successfully fetched ${url}, size: ${response.data?.length || 0} bytes`);
            return response.data;
          } catch (error) {
            this.logger.warn(`Failed to fetch blocklist from ${url}: ${error.message}`);
            return '';
          }
        })
      );
      
      // Filter out empty responses and combine all blocklists
      const validBlocklists = blocklists.filter(list => !!list);
      const combinedBlocklist = validBlocklists.join('\n');
      
      this.logger.log(`Combined ${validBlocklists.length} blocklists with total size: ${combinedBlocklist.length} bytes`);
      
      if (!combinedBlocklist) {
        throw new Error('No valid blocklists were fetched');
      }
      
      this.logger.log('Blocklists fetched and combined successfully');
      return combinedBlocklist;
    } catch (error) {
      this.logger.error(`Failed to fetch blocklists: ${error.message}`);
      throw error;
    }
  }
} 