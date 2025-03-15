import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retryWhen } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorService } from '../services/error.service';
import { RetryStrategyService } from '../services/retry-strategy.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  // List of endpoints that should have retry behavior
  private retryableEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/profile',
    '/tasks',
    '/users'
  ];

  constructor(
    private errorService: ErrorService,
    private retryStrategy: RetryStrategyService
  ) {}

  private shouldApplyRetryStrategy(url: string): boolean {
    // Only apply retry strategy to API calls
    if (!url.includes(environment.apiUrl)) {
      return false;
    }
    
    // Remove the base URL if present to check against endpoint patterns
    const urlWithoutBase = url.replace(environment.apiUrl, '');
    return this.retryableEndpoints.some(endpoint => urlWithoutBase.includes(endpoint));
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add base URL if it's not already a full URL and it's not a navigation request
    const isApiRequest = !request.url.startsWith('http') && !request.url.startsWith('/');
    
    const apiReq = isApiRequest
      ? request.clone({
          url: `${environment.apiUrl}${request.url}`,
          headers: request.headers.set('Content-Type', 'application/json')
        })
      : request.clone({
          headers: request.headers.set('Content-Type', 'application/json')
        });

    // Only apply error handling to API requests
    if (apiReq.url.includes(environment.apiUrl)) {
      const handler = next.handle(apiReq).pipe(
        catchError(error => this.errorService.handleError(error))
      );

      // Apply retry strategy to specific endpoints
      if (this.shouldApplyRetryStrategy(apiReq.url)) {
        return handler.pipe(
          retryWhen(error => this.retryStrategy.getRetryStrategy()(error, apiReq))
        );
      }

      return handler;
    }

    // Pass through non-API requests without modification
    return next.handle(apiReq);
  }
}
