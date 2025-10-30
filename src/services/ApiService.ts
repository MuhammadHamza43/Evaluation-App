/**
 * API Service for handling product data from fakestoreapi.com
 * Enhanced with graceful degradation and comprehensive error handling
 * Requirements: 2.1, 2.4, 7.1, 7.2
 */

import { Product, ApiError } from '../types';
import { CircuitBreaker, safeFetch } from '../utils/gracefulDegradation';
import { handleError } from '../utils/errorUtils';

export class ApiService {
  private static readonly BASE_URL = 'https://fakestoreapi.com';
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000; // 1 second
  
  // Circuit breaker for API resilience
  private static circuitBreaker = new CircuitBreaker(5, 60000, 'API Service');
  
  // Cache for graceful degradation
  private static cachedProducts: Product[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all products from the API with enhanced error handling and caching
   * Requirements: 2.1 - Fetch product data from API_Service
   */
  static async fetchProducts(): Promise<Product[]> {
    try {
      // Try to use circuit breaker for resilience
      const products = await this.circuitBreaker.execute(async () => {
        const result = await safeFetch<any[]>(
          `${this.BASE_URL}/products`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
          {
            timeout: this.TIMEOUT_MS,
            maxRetries: this.MAX_RETRIES,
            retryDelay: this.RETRY_DELAY_MS,
            context: 'Fetch products',
            validateResponse: (data) => Array.isArray(data) && data.length > 0,
            fallbackValue: this.getCachedProducts(),
          }
        );

        if (!result.success) {
          if (result.fallbackUsed && result.data) {
            console.info('Using cached products due to API failure');
            return result.data;
          }
          throw result.error || new Error('Failed to fetch products');
        }

        const transformedProducts = this.transformProductData(result.data!);
        this.setCachedProducts(transformedProducts);
        return transformedProducts;
      });

      return products;
    } catch (error) {
      // Final fallback: try to use cached data
      const cachedProducts = this.getCachedProducts();
      if (cachedProducts.length > 0) {
        console.warn('API completely unavailable, using cached products');
        return cachedProducts;
      }

      // No cache available, throw enhanced error
      const appError = handleError(error, 'API Service');
      throw this.createApiError(
        appError.userMessage,
        0,
        appError.code || 'API_UNAVAILABLE'
      );
    }
  }

  /**
   * Get cached products if available and not expired
   */
  private static getCachedProducts(): Product[] {
    if (
      this.cachedProducts &&
      Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedProducts;
    }
    return [];
  }

  /**
   * Cache products for graceful degradation
   */
  private static setCachedProducts(products: Product[]): void {
    this.cachedProducts = products;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Clear cached products
   */
  static clearCache(): void {
    this.cachedProducts = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get circuit breaker status for monitoring
   */
  static getServiceStatus(): {
    circuitBreakerState: string;
    hasCachedData: boolean;
    cacheAge: number;
  } {
    const cbState = this.circuitBreaker.getState();
    return {
      circuitBreakerState: cbState.state,
      hasCachedData: this.cachedProducts !== null,
      cacheAge: Date.now() - this.cacheTimestamp,
    };
  }

  /**
   * Fetch with timeout to prevent hanging requests
   * Requirements: 7.1, 7.2 - Handle network failures and timeouts
   */
  private static async fetchWithTimeout(endpoint: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createApiError('Request timeout', 408, 'TIMEOUT');
        }
        throw this.createApiError(
          `Network error: ${error.message}`, 
          0, 
          'NETWORK_ERROR'
        );
      }
      
      throw this.createApiError('Unknown network error', 0, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Retry mechanism for failed requests
   * Requirements: 7.1, 7.2 - Implement retry logic for failed operations
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.MAX_RETRIES) {
        throw error;
      }

      // Don't retry on client errors (4xx), only on server errors and network issues
      if (error instanceof Error && 'status' in error) {
        const apiError = error as ApiError & { status?: number };
        if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
          throw error;
        }
      }

      // Wait before retrying with exponential backoff
      const delay = this.RETRY_DELAY_MS * Math.pow(2, retryCount);
      await this.sleep(delay);
      
      return this.withRetry(operation, retryCount + 1);
    }
  }

  /**
   * Transform and validate product data from API
   * Requirements: 2.1 - Ensure data consistency and validation
   */
  private static transformProductData(data: unknown): Product[] {
    if (!Array.isArray(data)) {
      throw this.createApiError(
        'Invalid API response: expected array of products',
        0,
        'INVALID_RESPONSE'
      );
    }

    return data.map((item, index) => {
      try {
        return this.validateAndTransformProduct(item);
      } catch (error) {
        console.warn(`Skipping invalid product at index ${index}:`, error);
        return null;
      }
    }).filter((product): product is Product => product !== null);
  }

  /**
   * Validate and transform individual product data
   * Requirements: 2.1 - Data validation and transformation
   */
  private static validateAndTransformProduct(item: unknown): Product {
    if (!item || typeof item !== 'object') {
      throw new Error('Product must be an object');
    }

    const product = item as Record<string, unknown>;

    // Validate required fields
    if (typeof product.id !== 'number') {
      throw new Error('Product id must be a number');
    }
    
    if (typeof product.title !== 'string' || !product.title.trim()) {
      throw new Error('Product title must be a non-empty string');
    }
    
    if (typeof product.price !== 'number' || product.price < 0) {
      throw new Error('Product price must be a non-negative number');
    }
    
    if (typeof product.description !== 'string') {
      throw new Error('Product description must be a string');
    }
    
    if (typeof product.category !== 'string') {
      throw new Error('Product category must be a string');
    }
    
    if (typeof product.image !== 'string' || !this.isValidUrl(product.image)) {
      throw new Error('Product image must be a valid URL string');
    }

    // Validate rating object
    if (!product.rating || typeof product.rating !== 'object') {
      throw new Error('Product rating must be an object');
    }

    const rating = product.rating as Record<string, unknown>;
    if (typeof rating.rate !== 'number' || rating.rate < 0 || rating.rate > 5) {
      throw new Error('Product rating.rate must be a number between 0 and 5');
    }
    
    if (typeof rating.count !== 'number' || rating.count < 0) {
      throw new Error('Product rating.count must be a non-negative number');
    }

    return {
      id: product.id,
      title: product.title.trim(),
      price: Math.round(product.price * 100) / 100, // Round to 2 decimal places
      description: product.description.trim(),
      category: product.category.trim(),
      image: product.image,
      rating: {
        rate: Math.round(rating.rate * 10) / 10, // Round to 1 decimal place
        count: Math.floor(rating.count), // Ensure integer
      },
    };
  }

  /**
   * Create standardized API error objects
   * Requirements: 2.4, 7.1 - Standardized error handling
   */
  private static createApiError(
    message: string, 
    status?: number, 
    code?: string
  ): ApiError {
    return {
      message,
      status,
      code,
    };
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}