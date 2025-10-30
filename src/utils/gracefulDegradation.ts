/**
 * Graceful degradation utilities for handling partial failures
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { handleError, AppError } from './errorUtils';

/**
 * Configuration for graceful degradation
 */
interface GracefulConfig {
    maxRetries?: number;
    retryDelay?: number;
    fallbackValue?: any;
    logErrors?: boolean;
    context?: string;
}

/**
 * Result of a graceful operation
 */
interface GracefulResult<T> {
    success: boolean;
    data?: T;
    error?: AppError;
    fallbackUsed: boolean;
    retryCount: number;
}

/**
 * Execute operation with graceful degradation
 */
export async function withGracefulDegradation<T>(
    operation: () => Promise<T>,
    config: GracefulConfig = {}
): Promise<GracefulResult<T>> {
    const {
        maxRetries = 2,
        retryDelay = 1000,
        fallbackValue,
        logErrors = true,
        context = 'Operation'
    } = config;

    let lastError: AppError | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();
            return {
                success: true,
                data: result,
                fallbackUsed: false,
                retryCount: attempt,
            };
        } catch (error) {
            lastError = handleError(error, context);
            retryCount = attempt;

            if (logErrors) {
                console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
            }

            // Don't retry on certain error types
            if (!lastError.recoverable || attempt === maxRetries) {
                break;
            }

            // Wait before retrying
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            }
        }
    }

    // Operation failed, use fallback if available
    if (fallbackValue !== undefined) {
        if (logErrors) {
            console.info(`${context} using fallback value after ${retryCount + 1} attempts`);
        }

        return {
            success: false,
            data: fallbackValue,
            error: lastError,
            fallbackUsed: true,
            retryCount,
        };
    }

    // No fallback available
    return {
        success: false,
        error: lastError,
        fallbackUsed: false,
        retryCount,
    };
}

/**
 * Execute multiple operations with partial failure tolerance
 */
export async function withPartialFailureTolerance<T>(
    operations: Array<() => Promise<T>>,
    config: GracefulConfig & { minSuccessRate?: number } = {}
): Promise<{
    results: Array<GracefulResult<T>>;
    successRate: number;
    overallSuccess: boolean;
}> {
    const { minSuccessRate = 0.5, logErrors = true, context = 'Batch operation' } = config;

    const results = await Promise.all(
        operations.map((operation, index) =>
            withGracefulDegradation(operation, {
                ...config,
                context: `${context} [${index}]`,
            })
        )
    );

    const successCount = results.filter(result => result.success).length;
    const successRate = operations.length > 0 ? successCount / operations.length : 0;
    const overallSuccess = successRate >= minSuccessRate;

    if (logErrors && !overallSuccess) {
        console.warn(
            `${context} partial failure: ${successCount}/${operations.length} operations succeeded (${(successRate * 100).toFixed(1)}%)`
        );
    }

    return {
        results,
        successRate,
        overallSuccess,
    };
}

/**
 * Safe component wrapper for graceful degradation
 */
export function withSafeComponent<P extends object>(
    Component: any, // React.ComponentType<P>
    fallbackComponent?: any, // React.ComponentType<P>
    errorHandler?: (error: Error) => void
): any { // React.ComponentType<P>
    return function SafeComponent(props: P) {
        try {
            // For React Native, we need to handle this differently
            if (typeof Component === 'function') {
                return Component(props);
            }
            return null;
        } catch (error) {
            if (errorHandler) {
                errorHandler(error instanceof Error ? error : new Error(String(error)));
            } else {
                console.error('Component render error:', error);
            }

            if (fallbackComponent && typeof fallbackComponent === 'function') {
                return fallbackComponent(props);
            }

            // Default fallback for React Native
            return null;
        }
    };
}

/**
 * Safe data fetching with graceful degradation
 */
export async function safeFetch<T>(
    url: string,
    options: RequestInit = {},
    config: GracefulConfig & {
        timeout?: number;
        validateResponse?: (data: any) => boolean;
    } = {}
): Promise<GracefulResult<T>> {
    const {
        timeout = 10000,
        validateResponse,
        context = `Fetch ${url}`,
        ...gracefulConfig
    } = config;

    return withGracefulDegradation(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (validateResponse && !validateResponse(data)) {
                throw new Error('Response validation failed');
            }

            return data as T;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }, { ...gracefulConfig, context });
}

/**
 * Safe storage operations with graceful degradation
 */
export async function safeStorageOperation<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    context: string = 'Storage operation'
): Promise<T> {
    const result = await withGracefulDegradation(operation, {
        maxRetries: 1,
        fallbackValue,
        context,
    });

    return result.data!;
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private maxFailures: number = 5,
        private resetTimeout: number = 60000, // 1 minute
        private context: string = 'Circuit breaker'
    ) { }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'half-open';
                console.info(`${this.context}: Circuit breaker half-open, attempting recovery`);
            } else {
                throw new Error(`${this.context}: Circuit breaker is open`);
            }
        }

        try {
            const result = await operation();

            if (this.state === 'half-open') {
                this.reset();
                console.info(`${this.context}: Circuit breaker closed, service recovered`);
            }

            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    private recordFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.maxFailures) {
            this.state = 'open';
            console.warn(`${this.context}: Circuit breaker opened after ${this.failures} failures`);
        }
    }

    private reset(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    getState(): { state: string; failures: number; lastFailureTime: number } {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
        };
    }
}

export default {
    withGracefulDegradation,
    withPartialFailureTolerance,
    withSafeComponent,
    safeFetch,
    safeStorageOperation,
    CircuitBreaker,
};