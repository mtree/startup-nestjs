import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('@app/features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@app/features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    // Add auth guard later
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
