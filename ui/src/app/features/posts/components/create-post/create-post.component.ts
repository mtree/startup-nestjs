import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PostsService } from '../../services/posts.service';
import { CreatePostDto } from 'src/lib/api-client/model/createPostDto';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit {
  postForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private postsService: PostsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.postForm = this.formBuilder.group({
      resourceUrl: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const createPostDto: CreatePostDto = this.postForm.value;

    this.postsService.createPost(createPostDto).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Post created successfully! It will be processed in the background.', 'Close', {
          duration: 5000,
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.snackBar.open(`Failed to create post: ${error.message || 'Unknown error'}`, 'Close', {
          duration: 5000,
        });
      }
    });
  }
} 