import { TestBed } from '@angular/core/testing';
import { HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';

import { ApiInterceptor } from './api.interceptor';
import { ErrorService } from '../services/error.service';
import { RetryStrategyService } from '../services/retry-strategy.service';

describe('ApiInterceptor', () => {
  let interceptor: ApiInterceptor;
  let errorService: jasmine.SpyObj<ErrorService>;
  let retryStrategy: jasmine.SpyObj<RetryStrategyService>;

  beforeEach(() => {
    // Create mock services
    const errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);
    errorServiceSpy.handleError.and.returnValue(of(null));
    
    const retryStrategySpy = jasmine.createSpyObj('RetryStrategyService', ['getRetryStrategy']);
    retryStrategySpy.getRetryStrategy.and.returnValue(() => of(null));

    TestBed.configureTestingModule({
      providers: [
        ApiInterceptor,
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: RetryStrategyService, useValue: retryStrategySpy }
      ]
    });

    interceptor = TestBed.inject(ApiInterceptor);
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
    retryStrategy = TestBed.inject(RetryStrategyService) as jasmine.SpyObj<RetryStrategyService>;
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('shouldApplyRetryStrategy', () => {
    it('should return true for retryable endpoints', () => {
      // Access the private method using type assertion
      const shouldRetry = (interceptor as any).shouldApplyRetryStrategy.bind(interceptor);
      
      // Test with retryable endpoints
      expect(shouldRetry('/api/tasks')).toBeTrue();
      expect(shouldRetry('/api/tasks/123')).toBeTrue();
      expect(shouldRetry('/api/users')).toBeTrue();
      expect(shouldRetry('/api/users/profile')).toBeTrue();
    });

    it('should return false for non-retryable endpoints', () => {
      // Access the private method using type assertion
      const shouldRetry = (interceptor as any).shouldApplyRetryStrategy.bind(interceptor);
      
      // Test with non-retryable endpoints
      expect(shouldRetry('/api/auth/login')).toBeFalse();
      expect(shouldRetry('/api/settings')).toBeFalse();
    });
  });
}); 