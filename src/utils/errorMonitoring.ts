/**
 * Error monitoring and reporting utilities
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  appVersion?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByContext: Record<string, number>;
  recentErrors: ErrorReport[];
}

/**
 * Error monitoring service for tracking and reporting errors
 */
export class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private errors: ErrorReport[] = [];
  private maxStoredErrors = 100;
  private reportingEnabled = true;

  private constructor() {
    // Initialize error monitoring
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          'Unhandled Promise Rejection',
          'critical'
        );
      });

      // Handle global JavaScript errors
      window.addEventListener('error', (event) => {
        this.reportError(
          event.error || new Error(event.message),
          'Global JavaScript Error',
          'critical'
        );
      });
    }

    // React Native specific error handling
    if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
      const ErrorUtils = (global as any).ErrorUtils;
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        this.reportError(
          error,
          'React Native Global Error',
          isFatal ? 'critical' : 'high'
        );
        
        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Report an error to the monitoring system
   */
  reportError(
    error: Error,
    context: string = 'Unknown',
    level: ErrorReport['level'] = 'medium',
    additionalData?: Record<string, any>
  ): string {
    if (!this.reportingEnabled) {
      return '';
    }

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      level,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      additionalData,
    };

    // Store error locally
    this.storeError(errorReport);

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorMonitoring] ${level.toUpperCase()}: ${context}`, errorReport);
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Store error locally with rotation
   */
  private storeError(errorReport: ErrorReport): void {
    this.errors.unshift(errorReport);
    
    // Rotate errors to prevent memory issues
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }
  }

  /**
   * Send error to external monitoring service
   */
  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, this would send to services like:
      // - Sentry: Sentry.captureException(error, { contexts: { errorReport } });
      // - Bugsnag: Bugsnag.notify(error, { metadata: errorReport });
      // - Custom analytics endpoint
      
      console.log('Error would be sent to external service:', errorReport.id);
      
      // Example implementation for custom endpoint:
      /*
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
      */
    } catch (sendError) {
      console.error('Failed to send error to external service:', sendError);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const errorsByType: Record<string, number> = {};
    const errorsByContext: Record<string, number> = {};

    this.errors.forEach(error => {
      // Count by error type
      const errorType = error.error.name || 'Unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

      // Count by context
      errorsByContext[error.context] = (errorsByContext[error.context] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsByContext,
      recentErrors: this.errors.slice(0, 10), // Last 10 errors
    };
  }

  /**
   * Get errors by level
   */
  getErrorsByLevel(level: ErrorReport['level']): ErrorReport[] {
    return this.errors.filter(error => error.level === level);
  }

  /**
   * Clear stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable/disable error reporting
   */
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  /**
   * Check if error reporting is enabled
   */
  isReportingEnabled(): boolean {
    return this.reportingEnabled;
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errors.slice(0, count);
  }

  /**
   * Search errors by context or message
   */
  searchErrors(query: string): ErrorReport[] {
    const lowerQuery = query.toLowerCase();
    return this.errors.filter(error => 
      error.context.toLowerCase().includes(lowerQuery) ||
      error.error.message.toLowerCase().includes(lowerQuery) ||
      error.error.name.toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Convenience function to report errors
 */
export function reportError(
  error: Error,
  context?: string,
  level?: ErrorReport['level'],
  additionalData?: Record<string, any>
): string {
  return ErrorMonitoring.getInstance().reportError(error, context, level, additionalData);
}

/**
 * Convenience function to get error stats
 */
export function getErrorStats(): ErrorStats {
  return ErrorMonitoring.getInstance().getErrorStats();
}

/**
 * Higher-order function to wrap functions with error monitoring
 */
export function withErrorMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  context: string,
  level: ErrorReport['level'] = 'medium'
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          reportError(error, context, level);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), context, level);
      throw error;
    }
  }) as T;
}

/**
 * React hook for error monitoring
 */
export function useErrorMonitoring() {
  const monitoring = ErrorMonitoring.getInstance();

  return {
    reportError: (error: Error, context?: string, level?: ErrorReport['level']) =>
      monitoring.reportError(error, context, level),
    getStats: () => monitoring.getErrorStats(),
    getRecentErrors: (count?: number) => monitoring.getRecentErrors(count),
    clearErrors: () => monitoring.clearErrors(),
  };
}

export default ErrorMonitoring;