import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post, PostProcessingStatus } from '../../entities/post.entity';
import { CrawlerService, CrawlResult } from './crawler.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { UnrecoverableError } from 'bullmq';

export interface ProcessPostResult {
  success: boolean;
  postId: string;
  authorId: string;
  resourceUrl: string;
  crawlResult?: CrawlResult;
  matchedAdblockFiltersCount?: number;
  error?: string;
}

export interface ProcessPostOptions {
  debugMode?: boolean;
}

@Injectable()
export class PostProcessorService {
  private readonly logger = new Logger(PostProcessorService.name);

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private crawlerService: CrawlerService,
    private notificationsService: NotificationsService
  ) {}

  async processPost(
    postId: string, 
    resourceUrl: string, 
    authorId: string,
    options: ProcessPostOptions = {}
  ): Promise<ProcessPostResult> {
    const { debugMode = false } = options;
    
    try {
      // Update post status to processing
      await this.updatePostStatus(postId, PostProcessingStatus.PROCESSING);
      
      // Crawl the URL
      this.logger.log(`Starting to crawl URL: ${resourceUrl}`);
      const crawlResult = await this.crawlerService.crawlUrl(resourceUrl, { debugMode });
      
      // Check if crawling was successful
      if (!crawlResult.success) {
        // Only log high-level context without duplicating the error message that was already logged in CrawlerService
        this.logger.warn(`Crawl failed for post ${postId} - recording error and updating status`);
        
        // Update post status to failed and store the error message
        await this.updatePostWithError(postId, crawlResult.errorMessage);
        
        // Simply throw an error with the message - if it was unrecoverable, that information is in the message
        throw new Error(crawlResult.errorMessage);
      }
      
      this.logger.log(`Finished crawling URL: ${resourceUrl}. Matched ${crawlResult.matchedAdblockFiltersCount} Adblock filters and blocked ${crawlResult.blockedResourcesCount} resource requests.`);
      
      // Extract title from crawl result
      const title = crawlResult?.title || '';
      
      // Update post with crawled data and mark as completed
      await this.updatePostAfterProcessing(postId, PostProcessingStatus.COMPLETED, title, crawlResult);
      
      return { 
        success: true, 
        postId, 
        authorId, 
        resourceUrl,
        matchedAdblockFiltersCount: crawlResult.matchedAdblockFiltersCount,
        crawlResult 
      };
    } catch (error) {
      // Just pass through any UnrecoverableError
      if (error instanceof UnrecoverableError) {
        // Log that we received an unrecoverable error
        this.logger.warn(`Received unrecoverable error for post ${postId}`, {
          postId,
          errorType: 'UnrecoverableError',
          message: error.message
        });
        
        // Update post status to failed
        await this.updatePostWithError(postId, error.message);
        
        // Rethrow the UnrecoverableError directly
        throw error;
      }
      
      // Regular errors are just logged normally
      this.logger.error(`Processing failed for post ${postId}`, {
        postId,
        resourceUrl,
        errorSummary: error.message?.substring(0, 100)
      });
      
      // Update post status to failed and store the error message
      await this.updatePostWithError(postId, error.message);
      
      // Return a result that clearly indicates failure
      return {
        success: false,
        postId,
        authorId,
        resourceUrl,
        error: error.message
      };
    }
  }

  async handleProcessingComplete(
    postId: string, 
    authorId: string, 
    resourceUrl: string
  ): Promise<void> {
    // No need to log here - it's already logged in the worker
    
    // Send notification of success
    if (authorId) {
      await this.sendProcessingNotification(authorId, {
        type: 'post-processed',
        postId,
        resourceUrl,
        status: 'completed',
        message: `Successfully processed URL: ${resourceUrl}`
      });
    }
  }

  async handleProcessingFailed(
    postId: string, 
    authorId: string, 
    resourceUrl: string,
    error: Error,
    attemptsMade: number,
    maxAttempts: number
  ): Promise<void> {
    // No need to log here - it's already logged in the worker
    
    // Only send failure notification if we've exhausted all retries
    if (attemptsMade >= maxAttempts && authorId) {
      await this.sendProcessingNotification(authorId, {
        type: 'post-processed',
        postId,
        resourceUrl,
        status: 'failed',
        message: `All attempts to process URL failed: ${resourceUrl}. Final error: ${error.message}`
      });
    }
  }

  private async updatePostStatus(postId: string, status: PostProcessingStatus): Promise<void> {
    await this.postsRepository.update(
      { id: postId },
      { processingStatus: status }
    );
  }

  private async updatePostAfterProcessing(
    postId: string, 
    status: PostProcessingStatus, 
    title: string,
    crawlResult: CrawlResult
  ): Promise<void> {
    const updateData: Partial<Post> = {
      processingStatus: status,
      title,
      metadata: {
        ...crawlResult.metadata,
        blockedRequestsCount: crawlResult.matchedAdblockFiltersCount
      }
    };
    
    await this.postsRepository.update(
      { id: postId },
      updateData
    );
  }

  private async updatePostWithError(postId: string, errorMessage: string): Promise<void> {
    const updateData: Partial<Post> = {
      processingStatus: PostProcessingStatus.FAILED,
      processingError: errorMessage?.substring(0, 500) // Truncate if needed
    };
    
    await this.postsRepository.update(
      { id: postId },
      updateData
    );
  }

  private async sendProcessingNotification(authorId: string, notification: any): Promise<void> {
    try {
      await this.notificationsService.sendPostProcessingNotification(authorId, notification);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
} 