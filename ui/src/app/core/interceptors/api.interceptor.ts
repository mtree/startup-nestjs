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
    return this.retryableEndpoints.some(endpoint => url.includes(endpoint));
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Don't modify requests that are already using the full URL
    if (request.url.startsWith('http')) {
      return next.handle(request);
    }

    // Add base URL and headers to all other requests
    const apiReq = request.clone({
      url: `${environment.apiUrl}${request.url}`,
      headers: request.headers.set('Content-Type', 'application/json')
    });

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
}
