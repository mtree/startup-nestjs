import { Routes } from '@angular/router';
import { isAuthenticatedGuard } from '../../core/guards/auth.guard';

export const POSTS_ROUTES: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./components/create-post/create-post.component').then(m => m.CreatePostComponent),
    canActivate: [isAuthenticatedGuard]
  }
]; 