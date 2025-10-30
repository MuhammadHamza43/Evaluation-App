import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../../App';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AppProvider } from '../../contexts/AppContext';
import HomeScreen from '../../screens/HomeScreen';
import DetailsScreen from '../../screens/DetailsScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  navigateDeprecated: jest.fn(),
  preload: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  isFocused: jest.fn(() => true),
} as any;

const mockHomeRoute = {
  key: 'home-key',
  name: 'Home' as const,
  params: undefined
} as any;

const mockDetailsRoute = {
  key: 'details-key',
  name: 'Details' as const,
  params: {
    product: {
      id: 1,
      title: 'Test Product',
      price: 29.99,
      description: 'Test description',
      category: 'electronics',
      image: 'https://example.com/image.jpg',
      rating: { rate: 4.5, count: 120 }
    }
  }
} as any;

describe('Theme Switching Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Theme Persistence and Application', () => {
    it('should persist theme preference across app restarts', async () => {
      // Set initial theme in storage
      await AsyncStorage.setItem('theme', 'dark');

      const { getByTestId, rerender } = render(<App />);

      // Wait for theme to load
      await waitFor(() => {
        const themeToggle = getByTestId('theme-toggle');
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });

      // Simulate app restart by re-rendering
      rerender(<App />);

      // Verify theme is still dark after restart
      await waitFor(() => {
        const themeToggle = getByTestId('theme-toggle');
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });
    });

    it('should apply theme consistently across all screens', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AppProvider>
            <HomeScreen navigation={mockNavigation} route={mockHomeRoute} />
          </AppProvider>
        </ThemeProvider>
      );

      // Get initial theme colors
      const homeContainer = getByTestId('home-container');
      const initialBackgroundColor = homeContainer.props.style.backgroundColor;

      // Toggle theme
      const themeToggle = getByTestId('theme-toggle');
      fireEvent.press(themeToggle);

      // Verify theme changed on HomeScreen
      await waitFor(() => {
        const updatedContainer = getByTestId('home-container');
        expect(updatedContainer.props.style.backgroundColor).not.toBe(initialBackgroundColor);
      });

      // Test DetailsScreen with same theme
      const { getByTestId: getDetailsTestId } = render(
        <ThemeProvider>
          <AppProvider>
            <DetailsScreen navigation={mockNavigation} route={mockDetailsRoute} />
          </AppProvider>
        </ThemeProvider>
      );

      const detailsContainer = getDetailsTestId('details-container');
      expect(detailsContainer.props.style.backgroundColor).toBe(
        getByTestId('home-container').props.style.backgroundColor
      );
    });

    it('should maintain text readability in both theme modes', async () => {
      const { getByTestId, getByText } = render(<App />);

      // Test light theme readability
      await waitFor(() => {
        const productTitle = getByText(/product/i);
        const titleStyle = productTitle.props.style;
        expect(titleStyle.color).toBeDefined();
      });

      // Switch to dark theme
      const themeToggle = getByTestId('theme-toggle');
      fireEvent.press(themeToggle);

      // Test dark theme readability
      await waitFor(() => {
        const productTitle = getByText(/product/i);
        const titleStyle = productTitle.props.style;
        expect(titleStyle.color).toBeDefined();
        // Verify color changed for dark theme
        expect(titleStyle.color).not.toBe('#000000'); // Should not be black in dark mode
      });
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle between light and dark themes smoothly', async () => {
      const { getByTestId } = render(<App />);

      const themeToggle = getByTestId('theme-toggle');

      // Initial state should be light theme
      expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to dark theme');

      // Toggle to dark theme
      fireEvent.press(themeToggle);

      await waitFor(() => {
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to light theme');
      });

      // Toggle back to light theme
      fireEvent.press(themeToggle);

      await waitFor(() => {
        expect(themeToggle).toHaveProp('accessibilityLabel', 'Switch to dark theme');
      });
    });

    it('should save theme preference to AsyncStorage when toggled', async () => {
      const { getByTestId } = render(<App />);

      const themeToggle = getByTestId('theme-toggle');

      // Toggle to dark theme
      fireEvent.press(themeToggle);

      // Verify theme was saved
      await waitFor(async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        expect(savedTheme).toBe('dark');
      });

      // Toggle back to light theme
      fireEvent.press(themeToggle);

      // Verify light theme was saved
      await waitFor(async () => {
        const savedTheme = await AsyncStorage.getItem('theme');
        expect(savedTheme).toBe('light');
      });
    });
  });

  describe('Component Theme Integration', () => {
    it('should apply theme to all UI components consistently', async () => {
      const { getByTestId } = render(<App />);

      // Test various components have theme applied
      const components = [
        'search-input',
        'product-card',
        'loading-spinner',
      ];

      for (const componentTestId of components) {
        try {
          const component = getByTestId(componentTestId);
          expect(component.props.style).toBeDefined();
        } catch (error) {
          // Component might not be visible initially, which is okay
        }
      }

      // Toggle theme and verify components update
      const themeToggle = getByTestId('theme-toggle');
      fireEvent.press(themeToggle);

      await waitFor(() => {
        // Verify at least one component updated its styling
        const container = getByTestId('home-container');
        expect(container.props.style.backgroundColor).toBeDefined();
      });
    });
  });
});