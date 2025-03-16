import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Guard that checks if the user is authenticated
 * Redirects to login if not authenticated
 */
export const isAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      
      // Redirect to login page with return url
      return router.createUrlTree(['/auth/login'], { 
        queryParams: { returnUrl: state.url }
      });
    })
  );
};

/**
 * Guard that checks if the user is NOT authenticated
 * Redirects to dashboard if already authenticated
 */
export const isNotAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      }
      
      // Redirect to dashboard if already authenticated
      return router.createUrlTree(['/dashboard']);
    })
  );
};

/**
 * Match guard for lazy loaded routes
 */
export const isAuthenticatedMatchGuard: CanMatchFn = (route, segments) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      
      // Redirect to login page
      router.navigate(['/auth/login']);
      return false;
    })
  );
}; 