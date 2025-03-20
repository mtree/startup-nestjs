import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PlaywrightBlocker } from '@ghostery/adblocker-playwright';
import { promises as fs } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import fetch from 'cross-fetch';

// Standard EasyList sources only
const BLOCKLIST_URLS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
];
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

@Injectable()
export class AdBlockService implements OnModuleInit {
  private readonly logger = new Logger(AdBlockService.name);
  private readonly cacheDir = join(process.cwd(), 'cache');
  private readonly cacheFile = join(this.cacheDir, 'blocklist.json');
  private blocker: PlaywrightBlocker | null = null;
  private isInitialized = false;

  constructor(private readonly httpService: HttpService) {}

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
          this.blocker = await PlaywrightBlocker.fromLists(
            fetch,
            [filterText], // Use as a single string for simpler parsing
            {
              enableCompression: true,
            }
          );
          this.logger.log('EasyList filters loaded successfully');
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
      // Ensure the cache directory exists
      await this.ensureCacheDir();
      
      // Try to read from cache first
      try {
        // Check if the cache file exists
        await fs.access(this.cacheFile);
        
        // Check if it's expired
        if (await this.isExpired()) {
          await this.updateBlocklist();
        }
        
        // Read the cached blocklist
        const data = await fs.readFile(this.cacheFile, 'utf-8');
        const { blocklist } = JSON.parse(data);
        return blocklist;
      } catch (error) {
        // Cache doesn't exist or is invalid, fetch from remote
        await this.updateBlocklist();
        
        // Read the newly cached blocklist
        const data = await fs.readFile(this.cacheFile, 'utf-8');
        const { blocklist } = JSON.parse(data);
        return blocklist;
      }
    } catch (error) {
      this.logger.error(`Failed to get filter text: ${error.message}`);
      return ''; // Return empty string on error
    }
  }
  
  /**
   * Update the blocklist from remote sources
   */
  private async updateBlocklist(): Promise<void> {
    try {
      this.logger.log('Updating blocklists from remote sources...');
      
      // Fetch all blocklists
      const blocklists = await Promise.all(
        BLOCKLIST_URLS.map(async (url) => {
          try {
            const response = await firstValueFrom(this.httpService.get(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
      
      // Save to cache with timestamp
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify({
          timestamp: Date.now(),
          blocklist,
        })
      );
      
      this.logger.log('Blocklist updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update blocklist: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if the cached blocklist is expired
   */
  private async isExpired(): Promise<boolean> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const { timestamp } = JSON.parse(data);
      
      // Check if cache has expired
      return Date.now() - timestamp > CACHE_EXPIRATION;
    } catch (error) {
      // If there's an error reading the file, consider it expired
      return true;
    }
  }
  
  /**
   * Ensure the cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }
} 