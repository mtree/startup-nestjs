import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { CrawlerService } from './services/crawler.service';
import { PostProcessorService } from './services/post-processor.service';
import { isNonRetriableError } from './utils/error-utils';

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
        // If we've reached this point with a failure result, just throw a regular error
        // This will allow normal retry behavior for recoverable errors
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      // Just check if it's already an UnrecoverableError and pass it through
      // Otherwise, look for specific error string patterns only at this top level
      if (!(error instanceof UnrecoverableError) && error.message && isNonRetriableError(error)) {
        this.logger.warn(`Converting to UnrecoverableError in worker: ${error.message}`);
        throw new UnrecoverableError(error.message);
      }
      
      // Pass through the error to BullMQ
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
    
    // If it's an UnrecoverableError or we've reached max attempts, handle permanent failure
    if (error instanceof UnrecoverableError || job.attemptsMade >= maxAttempts) {
      // For UnrecoverableError, log it clearly so we know retries were skipped
      if (error instanceof UnrecoverableError) {
        this.logger.warn(`Job ${job.id} for post ${postId} failed with unrecoverable error, skipping retries:`, {
          jobId: job.id,
          postId,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          errorMessage: error.message,
          resourceUrl: resourceUrl.substring(0, 100) // Truncate very long URLs
        });
      } else {
        // Only log job metadata at this level - detailed error is already logged at lower levels
        this.logger.error(`Job ${job.id} for post ${postId} failed permanently after ${job.attemptsMade} attempts`, {
          jobId: job.id,
          postId,
          attemptsMade: job.attemptsMade,
          maxAttempts,
          resourceUrl: resourceUrl.substring(0, 100) // Truncate very long URLs
        });
      }
      
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