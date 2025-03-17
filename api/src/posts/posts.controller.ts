import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post as PostEntity } from './entities/post.entity';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Create a new post with URL for crawling',
    description: 'Creates a post with the provided resource URL and queues it for asynchronous crawling by a worker process'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Post created and queued for crawling. The actual crawling happens asynchronously.', 
    type: PostEntity 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createPostDto: CreatePostDto, @Request() req): Promise<PostEntity> {
    return this.postsService.create(createPostDto, req.user);
  }
} 