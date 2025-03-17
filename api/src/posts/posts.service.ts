import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostProcessingStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../users/entities/user.entity';
import { PostsQueueService } from './queue/posts.queue.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private postsQueueService: PostsQueueService,
  ) {}

  async create(createPostDto: CreatePostDto, author: User): Promise<Post> {
    // Create new post entity
    const post = this.postsRepository.create({
      resourceUrl: createPostDto.resourceUrl,
      author,
      processingStatus: PostProcessingStatus.PENDING,
    });

    // Save post to database
    const savedPost = await this.postsRepository.save(post);

    try {
      // Add post to crawling queue
      await this.postsQueueService.addPostProcessingJob(savedPost);
      this.logger.log(`Added post ${savedPost.id} to crawling queue`);
    } catch (error) {
      // If queue fails, log error but don't fail the request
      this.logger.error(`Failed to add post ${savedPost.id} to queue: ${error.message}`, error.stack);
      
      // Update post status to reflect the queue failure
      await this.postsRepository.update(
        { id: savedPost.id },
        { processingStatus: PostProcessingStatus.FAILED }
      );
    }

    return savedPost;
  }
} 