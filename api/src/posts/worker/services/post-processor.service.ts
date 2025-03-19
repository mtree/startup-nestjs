import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post, PostProcessingStatus } from '../../entities/post.entity';
import { CrawlerService, CrawlResult } from './crawler.service';
import { NotificationsService } from '../../../notifications/notifications.service';

export interface ProcessPostResult {
  success: boolean;
  postId: string;
  authorId: string;
  resourceUrl: string;
  crawlResult?: CrawlResult;
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
      this.logger.log(`Finished crawling URL: ${resourceUrl}`);
      
      // Extract title from crawl result
      const title = crawlResult?.title || '';
      
      // Update post with crawled data and mark as completed
      await this.updatePostAfterProcessing(postId, PostProcessingStatus.COMPLETED, title, crawlResult);
      
      return { 
        success: true, 
        postId, 
        authorId, 
        resourceUrl, 
        crawlResult 
      };
    } catch (error) {
      // Log once with stack trace for debugging, but keep it concise
      this.logger.error(`Failed to process post ${postId}: ${error.message}`);
      
      // Update post status to failed and store the error message
      await this.updatePostWithError(postId, error.message);
      
      // Important: Return a result that clearly indicates failure
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
      metadata: crawlResult.metadata
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