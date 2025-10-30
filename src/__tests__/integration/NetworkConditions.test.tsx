import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';
import { ApiService } from '../../services/ApiService';

// Mock the API service
jest.mock('../../services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

const mockProducts = [
  {
    id: 1,
    title: 'Test Product 1',
    price: 29.99,
    description: 'A great test product',
    category: 'electronics',
    image: 'https://example.com/image1.jpg',
    rating: { rate: 4.5, count: 120 }
  }
];

describe('Network Conditions Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('API Failure Scenarios', () => {
    it('should handle complete API unavailability', async () => {
      // Mock complete API failure
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Network Error'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for error message to appear
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      }, { timeout: 5000 });

      // Verify no products are displayed
      expect(queryByText('Test Product 1')).toBeNull();

      // Verify retry button is available
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should handle API timeout scenarios', async () => {
      // Mock timeout error
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Request timeout'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Request timeout'));

      const { getByText, getByTestId } = render(<App />);

      // Wait for timeout error message
      await waitFor(() => {
        expect(getByText(/timeout|error/i)).toBeTruthy();
      });

      // Verify retry functionality works after timeout
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      fireEvent.press(getByTestId('retry-button'));

      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { getByText, getByTestId } = render(<App />);

      // Wait for error handling
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Verify app doesn't crash and retry is available
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should handle HTTP error status codes', async () => {
      // Mock HTTP 500 error
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Server Error'));
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server Error' }),
      });

      const { getByText, getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Test recovery from server error
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      fireEvent.press(getByTestId('retry-button'));

      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });
    });
  });

  describe('Intermittent Connectivity', () => {
    it('should handle intermittent network failures during app usage', async () => {
      // Start with successful connection
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      const { getByText, getByTestId } = render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Simulate network failure during refresh
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('Connection lost'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Connection lost'));

      // Trigger refresh
      const refreshControl = getByTestId('refresh-control');
      fireEvent(refreshControl, 'onRefresh');

      // Verify error handling during refresh
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Verify original data is still available (graceful degradation)
      expect(getByText('Test Product 1')).toBeTruthy();
    });

    it('should handle slow network responses', async () => {
      // Mock slow response
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApiService.fetchProducts = jest.fn().mockReturnValue(slowPromise);
      (global.fetch as jest.Mock).mockReturnValue(slowPromise);

      const { getByTestId, queryByText } = render(<App />);

      // Verify loading state is shown
      await waitFor(() => {
        expect(getByTestId('loading-spinner')).toBeTruthy();
      });

      // Verify no products shown yet
      expect(queryByText('Test Product 1')).toBeNull();

      // Resolve the slow promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      // Verify products load after delay
      await waitFor(() => {
        expect(queryByText('Test Product 1')).toBeTruthy();
      });
    });
  });

  describe('Image Loading Network Issues', () => {
    it('should handle image loading failures gracefully', async () => {
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      const { getByText, getByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
      });

      // Navigate to details
      fireEvent.press(getByText('Test Product 1'));

      // Simulate image loading failure
      await waitFor(() => {
        const productImage = getByTestId('product-image');
        fireEvent(productImage, 'onError');
      });

      // Verify placeholder is shown
      await waitFor(() => {
        expect(getByTestId('image-placeholder')).toBeTruthy();
      });
    });

    it('should handle multiple image loading failures', async () => {
      const multipleProducts = [
        ...mockProducts,
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

      mockApiService.fetchProducts = jest.fn().mockResolvedValue(multipleProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multipleProducts),
      });

      const { getByText, getAllByTestId } = render(<App />);

      // Wait for products to load
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(getByText('Test Product 2')).toBeTruthy();
      });

      // Simulate multiple image failures
      const productImages = getAllByTestId('product-image');
      productImages.forEach(image => {
        fireEvent(image, 'onError');
      });

      // Verify all placeholders are shown
      await waitFor(() => {
        const placeholders = getAllByTestId('image-placeholder');
        expect(placeholders.length).toBe(productImages.length);
      });
    });
  });

  describe('Network Recovery', () => {
    it('should recover gracefully when network is restored', async () => {
      // Start with network failure
      mockApiService.fetchProducts = jest.fn().mockRejectedValue(new Error('No connection'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('No connection'));

      const { getByText, getByTestId, queryByText } = render(<App />);

      // Wait for error state
      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });

      // Simulate network recovery
      mockApiService.fetchProducts = jest.fn().mockResolvedValue(mockProducts);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      // Trigger retry
      fireEvent.press(getByTestId('retry-button'));

      // Verify successful recovery
      await waitFor(() => {
        expect(getByText('Test Product 1')).toBeTruthy();
        expect(queryByText(/error/i)).toBeNull();
      });
    });
  });
});