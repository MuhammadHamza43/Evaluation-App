import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types';
import { safeStorageOperation } from '../utils/gracefulDegradation';
import { handleError } from '../utils/errorUtils';

/**
 * Storage service for managing local data persistence
 * Handles favorites and theme preferences with error handling and validation
 * Requirements: 5.2, 5.3, 6.4
 */
export class StorageService {
  // Storage keys
  private static readonly FAVORITES_KEY = '@ProductCatalog:favorites';
  private static readonly THEME_KEY = '@ProductCatalog:theme';

  /**
   * Get saved favorite product IDs from local storage with enhanced error handling
   * Requirements: 5.2, 5.3
   */
  static async getFavorites(): Promise<number[]> {
    return safeStorageOperation(
      async () => {
        const favoritesJson = await AsyncStorage.getItem(this.FAVORITES_KEY);
        
        if (!favoritesJson) {
          return [];
        }

        const favorites = JSON.parse(favoritesJson);
        
        // Validate that favorites is an array of numbers
        if (!Array.isArray(favorites)) {
          throw new Error('Invalid favorites data format in storage');
        }

        // Filter out invalid entries and ensure all are numbers
        const validFavorites = favorites.filter(id => 
          typeof id === 'number' && !isNaN(id) && id > 0
        );

        // Log if we had to filter out invalid data
        if (validFavorites.length !== favorites.length) {
          console.warn(`Filtered out ${favorites.length - validFavorites.length} invalid favorite entries`);
        }

        return validFavorites;
      },
      [], // fallback to empty array
      'Get favorites'
    );
  }

  /**
   * Add a product ID to favorites with enhanced error handling
   * Requirements: 5.2, 5.3
   */
  static async addFavorite(productId: number): Promise<void> {
    // Validate input
    if (typeof productId !== 'number' || isNaN(productId) || productId <= 0) {
      const error = new Error('Invalid product ID provided');
      const appError = handleError(error, 'Add favorite');
      throw new Error(appError.userMessage);
    }

    return safeStorageOperation(
      async () => {
        const currentFavorites = await this.getFavorites();
        
        // Check if already exists
        if (currentFavorites.includes(productId)) {
          return; // Already in favorites, no need to add
        }

        const updatedFavorites = [...currentFavorites, productId];
        await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));
      },
      undefined, // no fallback value for void operation
      'Add favorite'
    );
  }

  /**
   * Remove a product ID from favorites with enhanced error handling
   * Requirements: 5.2, 5.3
   */
  static async removeFavorite(productId: number): Promise<void> {
    // Validate input
    if (typeof productId !== 'number' || isNaN(productId) || productId <= 0) {
      const error = new Error('Invalid product ID provided');
      const appError = handleError(error, 'Remove favorite');
      throw new Error(appError.userMessage);
    }

    return safeStorageOperation(
      async () => {
        const currentFavorites = await this.getFavorites();
        const updatedFavorites = currentFavorites.filter(id => id !== productId);
        
        await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));
      },
      undefined, // no fallback value for void operation
      'Remove favorite'
    );
  }

  /**
   * Toggle favorite status for a product ID
   * Requirements: 5.2, 5.3
   */
  static async toggleFavorite(productId: number): Promise<boolean> {
    try {
      const currentFavorites = await this.getFavorites();
      const isFavorite = currentFavorites.includes(productId);

      if (isFavorite) {
        await this.removeFavorite(productId);
        return false;
      } else {
        await this.addFavorite(productId);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  }

  /**
   * Check if a product is in favorites
   * Requirements: 5.2, 5.3
   */
  static async isFavorite(productId: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(productId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Get saved theme preference from local storage with enhanced error handling
   * Requirements: 6.4
   */
  static async getTheme(): Promise<ThemeMode> {
    return safeStorageOperation(
      async () => {
        const themeValue = await AsyncStorage.getItem(this.THEME_KEY);
        
        if (!themeValue) {
          return 'light'; // Default theme
        }

        // Validate theme value
        if (themeValue === 'light' || themeValue === 'dark') {
          return themeValue;
        }

        throw new Error('Invalid theme value in storage');
      },
      'light', // fallback to light theme
      'Get theme'
    );
  }

  /**
   * Save theme preference to local storage with enhanced error handling
   * Requirements: 6.4
   */
  static async setTheme(theme: ThemeMode): Promise<void> {
    // Validate input
    if (theme !== 'light' && theme !== 'dark') {
      const error = new Error('Invalid theme mode provided');
      const appError = handleError(error, 'Set theme');
      throw new Error(appError.userMessage);
    }

    return safeStorageOperation(
      async () => {
        await AsyncStorage.setItem(this.THEME_KEY, theme);
      },
      undefined, // no fallback value for void operation
      'Set theme'
    );
  }

  /**
   * Clear all stored data (useful for testing or reset functionality)
   * Requirements: 5.2, 5.3, 6.4
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.FAVORITES_KEY, this.THEME_KEY]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Get storage usage information for debugging
   * Requirements: 5.2, 5.3, 6.4
   */
  static async getStorageInfo(): Promise<{ favorites: number; hasTheme: boolean }> {
    try {
      const favorites = await this.getFavorites();
      const theme = await AsyncStorage.getItem(this.THEME_KEY);
      
      return {
        favorites: favorites.length,
        hasTheme: theme !== null
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { favorites: 0, hasTheme: false };
    }
  }
}

export default StorageService;