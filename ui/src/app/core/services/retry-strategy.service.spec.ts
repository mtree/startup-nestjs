import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RetryStrategyService } from './retry-strategy.service';
import { RetryConfig } from '../models/retry-config.model';

describe('RetryStrategyService', () => {
  let service: RetryStrategyService;
  let mockRequest: HttpRequest<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RetryStrategyService]
    });
    service = TestBed.inject(RetryStrategyService);
    
    // Create a mock HTTP request
    mockRequest = new HttpRequest('GET', '/api/tasks');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shouldRetry', () => {
    it('should return false if max retries reached', () => {
      const error = { status: 500 };
      const result = service.shouldRetry(error, 2, mockRequest);
      expect(result).toBeFalse();
    });

    it('should return false if request method is not retryable', () => {
      const nonRetryableRequest = new HttpRequest('DELETE', '/api/tasks');
      const error = { status: 500 };
      const result = service.shouldRetry(error, 0, nonRetryableRequest);
      expect(result).toBeFalse();
    });

    it('should return false if status code is not included', () => {
      const error = { status: 400 }; // 400 is not in the default includedStatusCodes
      const result = service.shouldRetry(error, 0, mockRequest);
      expect(result).toBeFalse();
    });

    it('should return true for retryable requests with valid status codes', () => {
      const error = { status: 500 }; // 500 is in the default includedStatusCodes
      const result = service.shouldRetry(error, 0, mockRequest);
      expect(result).toBeTrue();
    });
  });

  describe('getDelay', () => {
    it('should calculate exponential backoff delay', () => {
      // First retry (retryCount = 0) should be around baseDelay (1000ms)
      const delay0 = service.getDelay(0);
      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThanOrEqual(1100); // Adding 100 for jitter

      // Second retry (retryCount = 1) should be around baseDelay * scalingFactor (2000ms)
      const delay1 = service.getDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThanOrEqual(2100); // Adding 100 for jitter
    });

    it('should not exceed maxDelay', () => {
      // With high retry count, delay should be capped at maxDelay (10000ms)
      const delay = service.getDelay(10); // This would be a very high value without the cap
      expect(delay).toBeLessThanOrEqual(10000 + 100); // maxDelay + max jitter
    });
  });

  describe('getRetryStrategy', () => {
    it('should return a function', () => {
      const retryStrategy = service.getRetryStrategy();
      expect(typeof retryStrategy).toBe('function');
    });
  });

  describe('updateConfig', () => {
    it('should update the retry configuration', () => {
      const newConfig: Partial<RetryConfig> = {
        maxRetries: 5,
        baseDelay: 2000,
        includedStatusCodes: [500, 503]
      };
      
      service.updateConfig(newConfig);
      
      // Test that the config was updated by checking behavior
      const error = { status: 500 };
      
      // Should now allow 5 retries instead of 2
      expect(service.shouldRetry(error, 2, mockRequest)).toBeTrue();
      expect(service.shouldRetry(error, 4, mockRequest)).toBeTrue();
      expect(service.shouldRetry(error, 5, mockRequest)).toBeFalse();
      
      // Base delay should now be 2000
      const delay = service.getDelay(0);
      expect(delay).toBeGreaterThanOrEqual(2000);
      expect(delay).toBeLessThanOrEqual(2100); // Adding 100 for jitter
      
      // Status code 429 should no longer be retryable
      const error429 = { status: 429 };
      expect(service.shouldRetry(error429, 0, mockRequest)).toBeFalse();
    });
  });
}); 