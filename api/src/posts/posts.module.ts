import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsQueueService } from './queue/posts.queue.service';
import { PostsProcessingWorker } from './worker/posts-processing.worker';
import { NotificationsModule } from '../notifications/notifications.module';
import { Post } from './entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    NotificationsModule,
    BullModule.registerQueue({
      name: 'posts-processing-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // 24 hours in seconds
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // 7 days in seconds
        },
      },
    }),
    BullBoardModule.forFeature({
      name: 'posts-processing-queue',
      adapter: BullMQAdapter
    })
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsQueueService, PostsProcessingWorker],
  exports: [PostsService],
})
export class PostsModule {} 