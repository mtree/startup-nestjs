import { UnrecoverableError } from 'bullmq';

// Network errors that don't need retries
export const NON_RETRIABLE_ERROR_CODES = [
  'ERR_NAME_NOT_RESOLVED',       // DNS resolution failed
  'ERR_UNKNOWN_URL_SCHEME',      // Invalid URL scheme
  'ERR_INVALID_URL',             // Malformed URL
  'ERR_ABORTED',                 // Navigation aborted
  'ERR_CONNECTION_REFUSED',      // Connection refused
  'ERR_ADDRESS_UNREACHABLE',     // Cannot reach address
  'ERR_CONNECTION_TIMED_OUT'     // Connection timed out (likely unreachable)
];

/**
 * Determines if an error should be treated as non-retriable
 * @param error The error to check
 * @returns boolean indicating if this is a non-retriable error
 */
export function isNonRetriableError(error: Error): boolean {
  if (error instanceof UnrecoverableError) {
    return true;
  }
  
  return !!(error.message && NON_RETRIABLE_ERROR_CODES.some(code => 
    error.message.includes(code)
  ));
} 