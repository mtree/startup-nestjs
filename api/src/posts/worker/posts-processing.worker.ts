import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlerService } from './services/crawler.service';
import { PostProcessorService } from './services/post-processor.service';

@Processor('posts-processing-queue')
export class PostsProcessingWorker extends WorkerHost {
  private readonly logger = new Logger(PostsProcessingWorker.name);

  constructor(
    private postProcessorService: PostProcessorService,
    private crawlerService: CrawlerService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId, resourceUrl, authorId, debugMode = false } = job.data;
    
    this.logger.log(`Processing job ${job.id} for post ${postId}, URL: ${resourceUrl}`);
    
    try {
      const result = await this.postProcessorService.processPost(postId, resourceUrl, authorId, { debugMode });
      
      // Explicitly check if the processing was successful
      if (!result.success) {
        // Just throw the error without additional logging (it's already logged in service)
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      // No need to log here - it's already logged in the service and will be caught by BullMQ
      throw error;
    }
  }
  
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
    
    const { postId, authorId, resourceUrl } = job.data;
    
    // Double-check the result to ensure we don't send success for a failed job
    const result = job.returnvalue;
    if (result && result.success === false) {
      this.logger.warn(`Job ${job.id} was marked as completed but had error: ${result.error}`);
      return; // Don't send completion notification for jobs that failed
    }
    
    this.postProcessorService.handleProcessingComplete(postId, authorId, resourceUrl);
  }
  
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    const { postId, authorId, resourceUrl } = job.data;
    const maxAttempts = job.opts.attempts || 1;
    
    if (job.attemptsMade >= maxAttempts) {
      // Only log once on final failure
      this.logger.error(`Job ${job.id} failed permanently after ${job.attemptsMade} attempts: ${error.message}`);
      
      this.postProcessorService.handleProcessingFailed(
        postId, 
        authorId, 
        resourceUrl, 
        error, 
        job.attemptsMade, 
        maxAttempts
      );
    } else {
      this.logger.log(`Job ${job.id} failed but will be retried. Attempt ${job.attemptsMade} of ${maxAttempts}`);
    }
  }
}