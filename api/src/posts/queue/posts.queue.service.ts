import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostsQueueService {
  constructor(
    @InjectQueue('posts-processing-queue') private postsQueue: Queue,
  ) {}

  async addPostProcessingJob(post: Post): Promise<void> {
    await this.postsQueue.add(
      'crawl-url',
      {
        postId: post.id,
        resourceUrl: post.resourceUrl,
        authorId: post.author?.id,
        createdAt: post.createdAt,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        // Remove job from completed queue after 24 hours, as we'll store results in the database
        removeOnComplete: 24 * 60 * 60 * 1000,
        // Keep failed jobs for 7 days for inspection
        removeOnFail: 7 * 24 * 60 * 60 * 1000,
      },
    );
  }
} 