/**
 * Custom hook for comprehensive error handling
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { handleError, AppError } from '../utils/errorUtils';
import { reportError } from '../utils/errorMonitoring';
import { withGracefulDegradation } from '../utils/gracefulDegradation';

interface ErrorHandlerOptions {
  context?: string;
  showUserFeedback?: boolean;
  logErrors?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackValue?: any;
}

interface ErrorState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
  hasError: boolean;
}

/**
 * Hook for handling errors with retry logic and user feedback
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    context = 'Operation',
    showUserFeedback = true,
    logErrors = true,
    maxRetries = 3,
    retryDelay = 1000,
    fallbackValue,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    hasError: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle an error with comprehensive error processing
   */
  const handleErrorWithFeedback = useCallback(
    (error: unknown, customContext?: string) => {
      const appError = handleError(error, customContext || context);
      
      setErrorState(prev => ({
        ...prev,
        error: appError,
        hasError: true,
      }));

      // Log error if enabled
      if (logErrors) {
        console.error(`[${context}] Error:`, appError);
      }

      // Report to monitoring system
      reportError(
        error instanceof Error ? error : new Error(String(error)),
        customContext || context,
        'medium'
      );

      // Show user feedback if enabled
      if (showUserFeedback) {
        Alert.alert(
          'Error',
          appError.userMessage,
          [
            { text: 'OK', style: 'default' },
            ...(appError.recoverable ? [{ 
              text: 'Retry', 
              onPress: () => retryLastOperation(),
              style: 'default' as const
            }] : [])
          ]
        );
      }

      return appError;
    },
    [context, logErrors, showUserFeedback]
  );

  /**
   * Execute operation with error handling and retry logic
   */
  const executeWithErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationContext?: string
    ): Promise<T | typeof fallbackValue> => {
      const result = await withGracefulDegradation(operation, {
        maxRetries,
        retryDelay,
        fallbackValue,
        logErrors,
        context: operationContext || context,
      });

      if (!result.success) {
        if (result.error) {
          handleErrorWithFeedback(result.error, operationContext);
        }
        
        if (result.fallbackUsed) {
          return result.data;
        }
        
        throw result.error || new Error('Operation failed');
      }

      // Clear error state on success
      clearError();
      return result.data!;
    },
    [context, maxRetries, retryDelay, fallbackValue, logErrors, handleErrorWithFeedback]
  );

  /**
   * Retry the last failed operation
   */
  const retryLastOperation = useCallback(() => {
    if (errorState.retryCount >= maxRetries) {
      Alert.alert(
        'Maximum Retries Reached',
        'The operation has failed multiple times. Please try again later or contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Retry with delay
    retryTimeoutRef.current = setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }, retryDelay);
  }, [errorState.retryCount, maxRetries, retryDelay]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      hasError: false,
    });

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Check if error is recoverable
   */
  const isRecoverable = useCallback(() => {
    return errorState.error?.recoverable ?? false;
  }, [errorState.error]);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback(() => {
    return errorState.error?.userMessage || 'An unexpected error occurred';
  }, [errorState.error]);

  /**
   * Wrap a function with error handling
   */
  const wrapWithErrorHandling = useCallback(
    <T extends (...args: any[]) => any>(
      fn: T,
      operationContext?: string
    ): T => {
      return ((...args: Parameters<T>) => {
        try {
          const result = fn(...args);
          
          // Handle async functions
          if (result instanceof Promise) {
            return result.catch((error: Error) => {
              handleErrorWithFeedback(error, operationContext);
              throw error;
            });
          }
          
          return result;
        } catch (error) {
          handleErrorWithFeedback(error, operationContext);
          throw error;
        }
      }) as T;
    },
    [handleErrorWithFeedback]
  );

  return {
    // State
    error: errorState.error,
    hasError: errorState.hasError,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    
    // Actions
    handleError: handleErrorWithFeedback,
    executeWithErrorHandling,
    retryLastOperation,
    clearError,
    wrapWithErrorHandling,
    
    // Utilities
    isRecoverable,
    getErrorMessage,
  };
}

export default useErrorHandler;