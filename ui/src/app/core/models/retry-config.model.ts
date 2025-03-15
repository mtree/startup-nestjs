export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Base delay in milliseconds between retries */
  baseDelay: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelay: number;
  
  /** Factor to multiply the delay by for each subsequent retry */
  scalingFactor: number;
  
  /** HTTP status codes that should trigger a retry */
  includedStatusCodes: number[];
  
  /** HTTP methods that are safe to retry */
  retryableRequests: string[];
}
