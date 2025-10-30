import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';
import { StorageService } from '../../services/StorageService';

// Mock the storage service
jest.mock('../../services/StorageService');
const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;

const mockProducts = [
  {
    id: 1,
    title: 'Test Product 1',
    price: 29.99,
    description: 'A great test product',
    category: 'electronics',
    image: 'https://example.com/image1.jpg',
    rating: { rate: 4.5, count: 120 }
  },
  {
    id: 2,
    title: 'Test Product 2',
    price: 49.99,
    description: 'Another test product',
    category: 'clothing',
    image: 'https://example.com/image2.jpg',
    rating: { rate: 3.8, count: 85 }
  }
];

describe('Data Persistence Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    });
  });

  describe('Favorites Persistence', () => {
    it('should persist favorites across app restarts', async () => {
      // Pre-populate favorites in storage
      await AsyncStorage.setItem('favorites', JSON.stringify([1]));
      mockStorageService.getFavorites = jest.fn().mockResolvedValue([1]);

      const { getByText, getByTestId, rerender } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Navigate to details of favorited product
      fireEvent.press(getByText('Test Product 1'));

      // Verify product is already favorited
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });

      // Simulate app restart by re-rendering
      rerender(<App />);

      // Navigate to same product again
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Test Product 1'));

      // Verify favorite status persisted
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });
    });

    it('should handle multiple favorites persistence', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Add first product to favorites
      fireEvent.press(getByText('Test Product 1'));
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton);
      });

      // Navigate back and add second product to favorites
      fireEvent.press(getByTestId('back-button'));
      fireEvent.press(getByText('Test Product 2'));
      
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton);
      });

      // Verify both favorites are saved
      await waitFor(async () => {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = JSON.parse(savedFavorites || '[]');
        expect(favorites).toContain(1);
        expect(favorites).toContain(2);
      });
    });

    it('should handle favorites removal persistence', async () => {
      // Start with a favorited product
      await AsyncStorage.setItem('favorites', JSON.stringify([1]));
      mockStorageService.getFavorites = jest.fn().mockResolvedValue([1]);

      const { getByText, getByTestId } = render(<App />);

      // Navigate to favorited product
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Test Product 1'));

      // Remove from favorites
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
        fireEvent.press(favoriteButton);
      });

      // Verify removal is persisted
      await waitFor(async () => {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = JSON.parse(savedFavorites || '[]');
        expect(favorites).not.toContain(1);
      });
    });
  });

  describe('Theme Preference Persistence', () => {
    it('should persist theme selection across app sessions', async () => {
      const { getByTestId, rerender } = render(<App />);

      // Switch to dark theme
      const themeToggle = getByTestId('theme-toggle');
      fireEvent.press(themeToggle);

      // Verify theme is saved
      await waitFor(async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        expect(savedTheme).toBe('dark');
      });

      // Simulate app restart
      rerender(<App />);

      // Verify theme persisted
      await waitFor(() => {
        const themeToggle = getByTestId('theme-toggle');
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });
    });

    it('should handle theme persistence with default fallback', async () => {
      // Ensure no theme is saved initially
      await AsyncStorage.removeItem('theme');

      const { getByTestId } = render(<App />);

      // Verify default light theme is applied
      await waitFor(() => {
        const themeToggle = getByTestId('theme-toggle');
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to dark theme');
      });
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle AsyncStorage failures gracefully', async () => {
      // Mock AsyncStorage failure
      const originalSetItem = AsyncStorage.setItem;
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage full'));

      const { getByText, getByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Try to add favorite (should not crash app)
      fireEvent.press(getByText('Test Product 1'));
      
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton);
      });

      // App should continue functioning despite storage error
      expect(getByText('Test Product 1')).toBeTruthy();

      // Restore original function
      AsyncStorage.setItem = originalSetItem;
    });

    it('should handle corrupted storage data', async () => {
      // Set corrupted data in storage
      await AsyncStorage.setItem('favorites', 'invalid-json');
      await AsyncStorage.setItem('theme', 'invalid-theme');

      const { getByText, getByTestId } = render(<App />);

      // App should still load with defaults
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Theme should default to light
      const themeToggle = getByTestId('theme-toggle');
      expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to dark theme');

      // Favorites should be empty (no crash)
      fireEvent.press(getByText('Test Product 1'));
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Add to favorites');
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across multiple operations', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Perform multiple operations rapidly
      fireEvent.press(getByText('Test Product 1'));
      
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton); // Add to favorites
      });

      fireEvent.press(getByTestId('back-button'));
      fireEvent.press(getByText('Test Product 2'));
      
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton); // Add to favorites
      });

      fireEvent.press(getByTestId('back-button'));
      fireEvent.press(getByText('Test Product 1'));
      
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        fireEvent.press(favoriteButton); // Remove from favorites
      });

      // Verify final state is consistent
      await waitFor(async () => {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = JSON.parse(savedFavorites || '[]');
        expect(favorites).toEqual([2]); // Only product 2 should be favorited
      });
    });

    it('should handle concurrent storage operations', async () => {
      const { getByTestId } = render(<App />);

      // Simulate concurrent theme and favorites operations
      const themeToggle = getByTestId('theme-toggle');
      
      // Rapid theme toggles
      fireEvent.press(themeToggle);
      fireEvent.press(themeToggle);
      fireEvent.press(themeToggle);

      // Verify final state is consistent
      await waitFor(async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        expect(['light', 'dark']).toContain(savedTheme);
      });
    });
  });

  describe('Storage Migration and Compatibility', () => {
    it('should handle legacy data formats gracefully', async () => {
      // Set legacy format data
      await AsyncStorage.setItem('favorites', '1,2,3'); // Old comma-separated format
      
      const { getByText } = render(<App />);

      // App should handle legacy format without crashing
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Should migrate to new format on next save
      fireEvent.press(getByText('Test Product 1'));
      // The app should handle the legacy format and continue working
    });
  });
});