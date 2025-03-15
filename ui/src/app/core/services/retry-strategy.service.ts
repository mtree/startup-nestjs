import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { RetryConfig } from '../models/retry-config.model';

@Injectable({
  providedIn: 'root'
})
export class RetryStrategyService {
  private defaultConfig: RetryConfig = {
    maxRetries: 2,
    baseDelay: 300,
    maxDelay: 2000,
    scalingFactor: 1.5,
    includedStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableRequests: ['GET', 'HEAD', 'OPTIONS', 'POST']
  };

  shouldRetry(error: any, retryCount: number, request: HttpRequest<any>): boolean {
    // Don't retry if we've hit the max retries
    if (retryCount >= this.defaultConfig.maxRetries) {
      return false;
    }

    // Don't retry if the request method isn't in our retryable list
    if (!this.defaultConfig.retryableRequests.includes(request.method)) {
      return false;
    }

    // Don't retry on authentication failures
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    // Only retry on specified status codes
    if (error.status && !this.defaultConfig.includedStatusCodes.includes(error.status)) {
      return false;
    }

    return true;
  }

  getDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.defaultConfig.baseDelay * 
      Math.pow(this.defaultConfig.scalingFactor, retryCount);
    
    const jitter = Math.random() * 100; // Add random jitter between 0-100ms
    const delay = Math.min(exponentialDelay + jitter, this.defaultConfig.maxDelay);
    
    return delay;
  }

  getRetryStrategy(): (error: Observable<any>, request: HttpRequest<any>) => Observable<any> {
    return (error: Observable<any>, request: HttpRequest<any>) => {
      let retryCount = 0;

      return new Observable(subscriber => {
        const subscription = error.subscribe({
          next: (err: any) => {
            if (this.shouldRetry(err, retryCount, request)) {
              const delay = this.getDelay(retryCount);
              retryCount++;
              
              console.debug(`Retrying request to ${request.url} (attempt ${retryCount}/${this.defaultConfig.maxRetries}) after ${delay}ms`);
              
              timer(delay).subscribe(() => {
                subscriber.next(err);
              });
            } else {
              subscriber.error(err);
            }
          },
          error: (e: any) => subscriber.error(e),
          complete: () => subscriber.complete()
        });

        return () => {
          subscription.unsubscribe();
        };
      });
    };
  }

  updateConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
  }
}
