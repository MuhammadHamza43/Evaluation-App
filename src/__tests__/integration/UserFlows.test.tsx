import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';
import { ApiService } from '../../services/ApiService';

// Mock the API service
jest.mock('../../services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

// Mock product data
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

describe('Complete User Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Mock successful API response
    mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
    
    // Mock fetch for successful responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProducts),
    });
  });

  describe('Home to Details to Favorites Flow', () => {
    it('should complete full user journey from browsing to adding favorites', async () => {
      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for products to load on HomeScreen
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Verify product prices are displayed
      expect(getByText('$29.99')).toBeTruthy();
      expect(getByText('$49.99')).toBeTruthy();

      // Navigate to product details by tapping on first product
      fireEvent.press(getByText('Test Product 1'));

      // Wait for navigation to DetailsScreen
      await waitFor(() => {
        expect(getByText('A great test product')).toBeTruthy();
      });

      // Verify product details are displayed
      expect(getByText('Test Product 1')).toBeTruthy();
      expect(getByText('$29.99')).toBeTruthy();
      expect(getByText('A great test product')).toBeTruthy();

      // Add product to favorites
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      // Verify favorite status is updated
      await waitFor(() => {
        expect(favoriteButton).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });

      // Navigate back to home
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      // Verify we're back on HomeScreen
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Navigate to second product
      fireEvent.press(getByText('Test Product 2'));

      // Verify second product details
      await waitFor(() => {
        expect(getByText('Another test product')).toBeTruthy();
      });

      // Verify first product is still favorited (persistence test)
      fireEvent.press(getByTestId('back-button'));
      fireEvent.press(getByText('Test Product 1'));
      
      await waitFor(() => {
        const favoriteBtn = getByTestId('favorite-button');
        expect(favoriteBtn).toHaveProp('accessibilityLabel', 'Remove from favorites');
      });
    });

    it('should handle search functionality in complete flow', async () => {
      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Use search functionality
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Test Product 1');

      // Verify filtered results
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(queryByText('Test Product 2')).toBeNull();
      });

      // Navigate to filtered product
      fireEvent.press(getByText('Test Product 1'));

      // Verify details screen shows correct product
      await waitFor(() => {
        expect(getByText('A great test product')).toBeTruthy();
      });

      // Clear search and verify all products return
      fireEvent.press(getByTestId('back-button'));
      fireEvent.changeText(searchInput, '');

      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });
    });
  });

  describe('Error Handling in User Flows', () => {
    it('should handle API errors gracefully during user flow', async () => {
      // Mock API failure
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Network error'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for error message to appear
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Verify retry functionality
      const retryButton = getByTestId('retry-button');
      
      // Mock successful retry
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      fireEvent.press(retryButton);

      // Verify products load after retry
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(queryByText(/error/i)).toBeNull();
      });
    });

    it('should handle image loading failures in product flow', async () => {
      const { getByText, getByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Navigate to product details
      fireEvent.press(getByText('Test Product 1'));

      // Simulate image loading error
      const productImage = getByTestId('product-image');
      fireEvent(productImage, 'onError');

      // Verify placeholder is shown
      await waitFor(() => {
        expect(getByTestId('image-placeholder')).toBeTruthy();
      });
    });
  });
});