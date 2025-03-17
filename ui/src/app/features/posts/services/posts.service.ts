import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePostDto } from 'src/lib/api-client/model/createPostDto';
import { Post } from 'src/lib/api-client/model/post';
import { PostsService as ApiPostsService } from 'src/lib/api-client/api/posts.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  constructor(private apiPostsService: ApiPostsService) {}

  /**
   * Create a new post
   * @param createPostDto Post data with resource URL
   * @returns Observable of Post
   */
  createPost(createPostDto: CreatePostDto): Observable<Post> {
    return this.apiPostsService.postsControllerCreate(createPostDto);
  }
} 