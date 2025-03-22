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
      }
    );
  }
} 