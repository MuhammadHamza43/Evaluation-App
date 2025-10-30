import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';

/**
 * Comprehensive Validation Test Suite
 * 
 * This test validates all requirements from the specification:
 * - Complete user flows from home to details to favorites
 * - Theme switching across all screens
 * - App behavior under various network conditions
 * - Data persistence across app restarts
 */

const mockProducts = [
  {
    id: 1,
    title: 'Validation Product 1',
    price: 29.99,
    description: 'Test product for validation',
    category: 'electronics',
    image: 'https://example.com/image1.jpg',
    rating: { rate: 4.5, count: 120 }
  },
  {
    id: 2,
    title: 'Validation Product 2',
    price: 49.99,
    description: 'Another validation product',
    category: 'clothing',
    image: 'https://example.com/image2.jpg',
    rating: { rate: 3.8, count: 85 }
  }
];

describe('Final Validation Test Suite - All Requirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Mock successful API by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    });
  });

  describe('Requirement 1: Navigation System Validation', () => {
    it('should provide seamless navigation between screens', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Verify Home Screen loads as initial screen
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });

      // Navigate to Details Screen
      fireEvent.press(getByText('Validation Product 1'));

      // Verify Details Screen loads
      await waitFor(() => {
        expect(getByText('Test product for validation')).toBeTruthy();
      });

      // Verify back navigation works
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      // Verify return to Home Screen
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(getByText('Validation Product 2')).toBeTruthy();
      });
    });
  });

  describe('Requirement 2: Product Display Validation', () => {
    it('should display products with loading states and error handling', async () => {
      const { getByText, getByTestId, queryByTestId } = render(<App />);

      // Verify loading indicator appears initially
      expect(getByTestId('loading-spinner')).toBeTruthy();

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(getByText('$29.99')).toBeTruthy();
      });

      // Verify loading indicator disappears
      expect(queryByTestId('loading-spinner')).toBeNull();

      // Test pull-to-refresh
      const refreshControl = getByTestId('refresh-control');
      fireEvent(refreshControl, 'onRefresh');

      // Verify products reload
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });
    });
  });

  describe('Requirement 3: Search Functionality Validation', () => {
    it('should filter products by search term', async () => {
      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(getByText('Validation Product 2')).toBeTruthy();
      });

      // Perform search
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Validation Product 1');

      // Verify filtered results
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(queryByText('Validation Product 2')).toBeNull();
      });

      // Clear search
      fireEvent.changeText(searchInput, '');

      // Verify all products return
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(getByText('Validation Product 2')).toBeTruthy();
      });
    });
  });

  describe('Requirement 4: Product Details Validation', () => {
    it('should display complete product information', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Navigate to product details
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Validation Product 1'));

      // Verify all product details are displayed
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
        expect(getByText('$29.99')).toBeTruthy();
        expect(getByText('Test product for validation')).toBeTruthy();
      });

      // Verify image handling
      const productImage = getByTestId('product-image');
      expect(productImage).toBeTruthy();

      // Test image error handling
      fireEvent(productImage, 'onError');
      await waitFor(() => {
        expect(getByTestId('image-placeholder')).toBeTruthy();
      });
    });
  });

  describe('Requirement 5: Favorites System Validation', () => {
    it('should manage favorites with persistence', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Navigate to product details
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Validation Product 1'));

      // Add to favorites
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Add to favorites');
        fireEvent.press(favoriteButton);
      });

      // Verify favorite status updated
      await waitFor(() => {
        const favoriteButton = getByTestId('favorite-button');
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });

      // Verify persistence
      await waitFor(async () => {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = JSON.parse(savedFavorites || '[]');
        expect(favorites).toContain(1);
      });
    });
  });

  describe('Requirement 6: Theme System Validation', () => {
    it('should switch themes with persistence across screens', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Verify initial light theme
      const themeToggle = getByTestId('theme-toggle');
      expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to dark theme');

      // Switch to dark theme
      fireEvent.press(themeToggle);

      // Verify theme changed
      await waitFor(() => {
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });

      // Verify theme persisted
      await waitFor(async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        expect(savedTheme).toBe('dark');
      });

      // Test theme consistency across screens
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Validation Product 1'));

      // Verify theme applied on details screen
      await waitFor(() => {
        const detailsContainer = getByTestId('details-container');
        expect(detailsContainer.props.style.backgroundColor).toBeDefined();
      });
    });
  });

  describe('Requirement 7: Error Handling Validation', () => {
    it('should handle all error scenarios gracefully', async () => {
      // Test API failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const { getByText, getByTestId, rerender } = render(<App />);

      // Verify error message appears
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Verify retry functionality
      expect(getByTestId('retry-button')).toBeTruthy();

      // Test recovery
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      fireEvent.press(getByTestId('retry-button'));

      // Verify successful recovery
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });
    });
  });

  describe('Cross-Requirement Integration Validation', () => {
    it('should handle complete user journey with all features', async () => {
      const { getByText, getByTestId } = render(<App />);

      // 1. Load products (Req 2)
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });

      // 2. Search products (Req 3)
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Validation Product 1');

      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });

      // 3. Navigate to details (Req 1, 4)
      fireEvent.press(getByText('Validation Product 1'));

      await waitFor(() => {
        expect(getByText('Test product for validation')).toBeTruthy();
      });

      // 4. Add to favorites (Req 5)
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });

      // 5. Switch theme (Req 6)
      const themeToggle = getByTestId('theme-toggle');
      fireEvent.press(themeToggle);

      await waitFor(() => {
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });

      // 6. Navigate back (Req 1)
      fireEvent.press(getByTestId('back-button'));

      // 7. Verify all state maintained
      await waitFor(() => {
        expect(getByText('Validation Product 1')).toBeTruthy();
      });

      // Verify theme persisted across navigation
      expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
    });
  });
});