/**
 * Error handling utilities for consistent error management
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface AppError {
  message: string;
  code?: string;
  type: 'network' | 'storage' | 'validation' | 'unknown';
  recoverable: boolean;
  userMessage: string;
}

/**
 * Create a standardized app error
 */
export function createAppError(
  message: string,
  type: AppError['type'] = 'unknown',
  code?: string,
  recoverable: boolean = true
): AppError {
  return {
    message,
    code,
    type,
    recoverable,
    userMessage: getUserFriendlyMessage(message, type),
  };
}

/**
 * Convert technical error messages to user-friendly messages
 */
export function getUserFriendlyMessage(message: string, type: AppError['type']): string {
  const lowerMessage = message.toLowerCase();

  switch (type) {
    case 'network':
      if (lowerMessage.includes('timeout')) {
        return 'Connection timed out. Please check your internet connection and try again.';
      }
      if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
        return 'Unable to connect to the internet. Please check your connection.';
      }
      if (lowerMessage.includes('server')) {
        return 'Server is temporarily unavailable. Please try again later.';
      }
      return 'Network error occurred. Please check your connection and try again.';

    case 'storage':
      return 'Unable to save your preferences. Please try again.';

    case 'validation':
      return 'Invalid data received. Please refresh and try again.';

    default:
      if (lowerMessage.includes('not found')) {
        return 'The requested item could not be found.';
      }
      if (lowerMessage.includes('unauthorized')) {
        return 'You are not authorized to perform this action.';
      }
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Handle errors with appropriate logging and user feedback
 */
export function handleError(error: unknown, context: string = 'Unknown'): AppError {
  console.error(`Error in ${context}:`, error);

  if (error instanceof Error) {
    // Check if it's already an AppError
    if ('type' in error && 'userMessage' in error && 'recoverable' in error) {
      return error as AppError;
    }

    // Determine error type based on error message
    const message = error.message.toLowerCase();
    let type: AppError['type'] = 'unknown';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      type = 'network';
    } else if (message.includes('storage') || message.includes('asyncstorage')) {
      type = 'storage';
    } else if (message.includes('invalid') || message.includes('validation')) {
      type = 'validation';
    }

    return createAppError(error.message, type);
  }

  // Handle non-Error objects
  const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
  return createAppError(errorMessage);
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Don't retry on certain error types
      if (lastError.message.includes('unauthorized') || 
          lastError.message.includes('forbidden') ||
          lastError.message.includes('not found')) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Graceful degradation helper
 */
export function withFallback<T>(
  operation: () => T,
  fallback: T,
  context: string = 'Operation'
): T {
  try {
    return operation();
  } catch (error) {
    console.warn(`${context} failed, using fallback:`, error);
    return fallback;
  }
}

/**
 * Async graceful degradation helper
 */
export async function withAsyncFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string = 'Operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${context} failed, using fallback:`, error);
    return fallback;
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Non-recoverable errors
    if (message.includes('unauthorized') || 
        message.includes('forbidden') ||
        message.includes('not found') ||
        message.includes('invalid') && message.includes('permanent')) {
      return false;
    }
  }

  return true;
}

/**
 * Format error for display to users
 */
export function formatErrorForDisplay(error: unknown): string {
  const appError = handleError(error);
  return appError.userMessage;
}

export default {
  createAppError,
  getUserFriendlyMessage,
  handleError,
  retryWithBackoff,
  withFallback,
  withAsyncFallback,
  isRecoverableError,
  formatErrorForDisplay,
};