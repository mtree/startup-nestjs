import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post, PostProcessingStatus } from '../entities/post.entity';

@Processor('posts-processing-queue')
export class PostsProcessingWorker extends WorkerHost {
  private readonly logger = new Logger(PostsProcessingWorker.name);

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId, resourceUrl } = job.data;
    
    this.logger.log(`Processing job ${job.id} for post ${postId}, URL: ${resourceUrl}`);
    
    try {
      // Update post status to processing
      await this.postsRepository.update(
        { id: postId },
        { processingStatus: PostProcessingStatus.PROCESSING }
      );

      // Simulate crawling work with a delay
      this.logger.log(`Starting to crawl URL: ${resourceUrl}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.logger.log(`Finished crawling URL: ${resourceUrl}`);
      
      // Update post with crawled data and mark as completed
      await this.postsRepository.update(
        { id: postId },
        { 
          processingStatus: PostProcessingStatus.COMPLETED,
        }
      );
      
      return { success: true, postId };
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`, error.stack);
      
      // Update post status to failed
      await this.postsRepository.update(
        { id: postId },
        { processingStatus: PostProcessingStatus.FAILED }
      );
      
      // Re-throw the error so BullMQ can handle retries
      throw error;
    }
  }
  
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }
  
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}