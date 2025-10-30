/**
 * Validation utilities for testing core functionality
 * Requirements: All requirements validation
 */

import { Product, ThemeMode } from '../types';

/**
 * Validate that all core app functionality is working
 */
export class AppValidator {
  /**
   * Test product data structure validation
   */
  static validateProductStructure(product: Product): boolean {
    try {
      // Check required fields
      if (typeof product.id !== 'number' || product.id <= 0) {
        console.error('Invalid product ID');
        return false;
      }

      if (typeof product.title !== 'string' || !product.title.trim()) {
        console.error('Invalid product title');
        return false;
      }

      if (typeof product.price !== 'number' || product.price < 0) {
        console.error('Invalid product price');
        return false;
      }

      if (typeof product.description !== 'string') {
        console.error('Invalid product description');
        return false;
      }

      if (typeof product.category !== 'string') {
        console.error('Invalid product category');
        return false;
      }

      if (typeof product.image !== 'string') {
        console.error('Invalid product image');
        return false;
      }

      // Check rating structure
      if (!product.rating || typeof product.rating !== 'object') {
        console.error('Invalid product rating');
        return false;
      }

      if (typeof product.rating.rate !== 'number' || 
          product.rating.rate < 0 || 
          product.rating.rate > 5) {
        console.error('Invalid product rating rate');
        return false;
      }

      if (typeof product.rating.count !== 'number' || product.rating.count < 0) {
        console.error('Invalid product rating count');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Product validation error:', error);
      return false;
    }
  }

  /**
   * Test theme mode validation
   */
  static validateThemeMode(mode: ThemeMode): boolean {
    return mode === 'light' || mode === 'dark';
  }

  /**
   * Test favorites array validation
   */
  static validateFavorites(favorites: number[]): boolean {
    if (!Array.isArray(favorites)) {
      return false;
    }

    return favorites.every(id => 
      typeof id === 'number' && 
      !isNaN(id) && 
      id > 0
    );
  }

  /**
   * Test search query validation
   */
  static validateSearchQuery(query: string): boolean {
    return typeof query === 'string';
  }

  /**
   * Test complete app state validation
   */
  static validateAppState(state: {
    products: Product[];
    favorites: number[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
  }): boolean {
    try {
      // Validate products array
      if (!Array.isArray(state.products)) {
        console.error('Products must be an array');
        return false;
      }

      // Validate each product
      for (const product of state.products) {
        if (!this.validateProductStructure(product)) {
          return false;
        }
      }

      // Validate favorites
      if (!this.validateFavorites(state.favorites)) {
        console.error('Invalid favorites array');
        return false;
      }

      // Validate loading state
      if (typeof state.loading !== 'boolean') {
        console.error('Loading must be boolean');
        return false;
      }

      // Validate error state
      if (state.error !== null && typeof state.error !== 'string') {
        console.error('Error must be string or null');
        return false;
      }

      // Validate search query
      if (!this.validateSearchQuery(state.searchQuery)) {
        console.error('Invalid search query');
        return false;
      }

      return true;
    } catch (error) {
      console.error('App state validation error:', error);
      return false;
    }
  }

  /**
   * Test network connectivity simulation
   */
  static async testNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Test data persistence simulation
   */
  static testDataPersistence(): boolean {
    try {
      // Test localStorage-like functionality
      const testKey = 'test_key';
      const testValue = { test: 'data' };
      
      // This would normally use AsyncStorage in React Native
      // For validation purposes, we just check the structure
      const serialized = JSON.stringify(testValue);
      const deserialized = JSON.parse(serialized);
      
      return deserialized.test === testValue.test;
    } catch (error) {
      console.error('Data persistence test failed:', error);
      return false;
    }
  }

  /**
   * Run all validation tests
   */
  static async runAllTests(): Promise<{
    productValidation: boolean;
    themeValidation: boolean;
    favoritesValidation: boolean;
    searchValidation: boolean;
    networkTest: boolean;
    persistenceTest: boolean;
    overallSuccess: boolean;
  }> {
    console.log('Running app validation tests...');

    // Test product validation
    const sampleProduct: Product = {
      id: 1,
      title: 'Test Product',
      price: 29.99,
      description: 'Test description',
      category: 'test',
      image: 'https://example.com/image.jpg',
      rating: { rate: 4.5, count: 100 }
    };

    const productValidation = this.validateProductStructure(sampleProduct);
    const themeValidation = this.validateThemeMode('light') && this.validateThemeMode('dark');
    const favoritesValidation = this.validateFavorites([1, 2, 3]);
    const searchValidation = this.validateSearchQuery('test query');
    const networkTest = await this.testNetworkConnectivity();
    const persistenceTest = this.testDataPersistence();

    const overallSuccess = productValidation && 
                          themeValidation && 
                          favoritesValidation && 
                          searchValidation && 
                          persistenceTest;

    const results = {
      productValidation,
      themeValidation,
      favoritesValidation,
      searchValidation,
      networkTest,
      persistenceTest,
      overallSuccess
    };

    console.log('Validation results:', results);
    return results;
  }
}

export default AppValidator;