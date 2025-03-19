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
      return await this.postProcessorService.processPost(postId, resourceUrl, authorId, { debugMode });
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
    
    const { postId, authorId, resourceUrl } = job.data;
    this.postProcessorService.handleProcessingComplete(postId, authorId, resourceUrl);
  }
  
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
    
    const { postId, authorId, resourceUrl } = job.data;
    const maxAttempts = job.opts.attempts || 1;
    
    if (job.attemptsMade >= maxAttempts) {
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