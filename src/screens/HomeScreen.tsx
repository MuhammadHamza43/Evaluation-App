import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useApp, useFilteredProducts } from '../contexts/AppContext';
import { ApiService } from '../services/ApiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { ErrorMessage } from '../components/ErrorMessage';
import type { HomeScreenProps, Product } from '../types';
import { ScreenNames } from '../types';

/**
 * HomeScreen - Main screen displaying product list and search functionality
 * Requirements: 1.2, 2.1, 2.2
 */
export default function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const { theme } = useTheme();
  const { state, setProducts, setLoading, setError, clearError, setSearchQuery } = useApp();
  const filteredProducts = useFilteredProducts();
  const [retryCount, setRetryCount] = useState(0);

  // Determine error type based on error message for better UX
  const getErrorType = useCallback((errorMessage: string): 'network' | 'server' | 'timeout' | 'generic' => {
    const message = errorMessage.toLowerCase();
    if (message.includes('network') || message.includes('connection') || message.includes('connect')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('server') || message.includes('unavailable') || message.includes('500')) {
      return 'server';
    }
    return 'generic';
  }, []);

  // Check network connectivity by attempting a simple fetch
  const checkNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Fetch products function with enhanced error handling
  const fetchProducts = useCallback(async () => {
    try {
      clearError();
      setLoading(true);
      const products = await ApiService.fetchProducts();
      setProducts(products);
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error) {
      let errorMessage = 'Failed to load products. Please try again.';
      
      // Handle different types of errors with user-friendly messages
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as any;
        switch (apiError.code) {
          case 'TIMEOUT':
            errorMessage = 'Request timed out. Please check your internet connection and try again.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network connection failed. Please check your internet connection.';
            break;
          case 'INVALID_RESPONSE':
            errorMessage = 'Received invalid data from server. Please try again later.';
            break;
          default:
            if (apiError.status >= 500) {
              errorMessage = 'Server is temporarily unavailable. Please try again later.';
            } else if (apiError.status >= 400) {
              errorMessage = 'Unable to load products. Please try again.';
            } else {
              errorMessage = apiError.message || errorMessage;
            }
        }
      } else if (error instanceof Error) {
        // Handle generic JavaScript errors
        if (error.message.toLowerCase().includes('network')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.toLowerCase().includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clearError, setLoading, setProducts, setError]);

  // Fetch products on screen mount
  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      if (isMounted && state.products.length === 0 && !state.loading) {
        await fetchProducts();
      }
    };
    
    loadProducts();
    
    return () => {
      isMounted = false;
    };
  }, [fetchProducts, state.products.length, state.loading]);

  // Add focus listener to retry loading when screen comes back into focus
  // This helps when users switch apps to check their network connection
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only retry if there's an error and no products loaded
      if (state.error && state.products.length === 0) {
        // Reset retry count when screen comes back into focus
        setRetryCount(0);
        fetchProducts();
      }
    });

    return unsubscribe;
  }, [navigation, state.error, state.products.length, fetchProducts]);

  // Handle search query changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Handle retry for error states with enhanced network connectivity check
  const handleRetry = useCallback(async () => {
    try {
      // Check network connectivity before retrying
      const isConnected = await checkNetworkConnectivity();
      
      if (!isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Retry', onPress: () => handleRetry(), style: 'default' }
          ]
        );
        return;
      }

      // Increment retry count for tracking
      setRetryCount(prev => prev + 1);
      
      // Progressive user feedback for multiple retries
      if (retryCount >= 2) {
        Alert.alert(
          'Persistent Connection Issues',
          'We\'re having trouble connecting to our servers. This might be a temporary issue on our end.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Keep Trying', onPress: () => fetchProducts(), style: 'default' },
            { text: 'Use Offline Mode', onPress: () => handleOfflineMode(), style: 'default' }
          ]
        );
      } else if (retryCount === 1) {
        Alert.alert(
          'Connection Issues',
          'Still having trouble connecting. Let\'s try once more.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => fetchProducts(), style: 'default' }
          ]
        );
      } else {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error in retry handler:', error);
      // Fallback to simple retry if connectivity check fails
      fetchProducts();
    }
  }, [fetchProducts, checkNetworkConnectivity, retryCount]);

  // Handle offline mode gracefully
  const handleOfflineMode = useCallback(() => {
    Alert.alert(
      'Offline Mode',
      'The app will continue with limited functionality. Some features may not be available.',
      [{ text: 'OK' }]
    );
    // Clear error to show empty state instead
    clearError();
  }, [clearError]);

  // Handle product selection
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate(ScreenNames.DETAILS, { product });
  }, [navigation]);

  // Render individual product item
  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={handleProductPress}
    />
  ), [handleProductPress]);

  // Calculate item layout for FlatList optimization
  // Each item has a fixed height for better performance
  const getItemLayout = useCallback((_data: any, index: number) => {
    const ITEM_HEIGHT = 200; // Approximate height of ProductCard
    const ITEM_MARGIN = 16; // Total margin (8 * 2)
    const itemHeight = ITEM_HEIGHT + ITEM_MARGIN;
    
    return {
      length: itemHeight,
      offset: itemHeight * Math.floor(index / 2), // 2 columns
      index,
    };
  }, []);

  // Render empty state
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {state.searchQuery ? 'No products found matching your search.' : 'No products available.'}
      </Text>
    </View>
  ), [state.searchQuery, theme.colors.textSecondary]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container} testID="home-container">
      <View style={dynamicStyles.content}>
        {/* Search Bar */}
        <SearchBar
          value={state.searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search products..."
        />
        
        {/* Error Display */}
        {state.error && (
          <ErrorMessage
            message={state.error}
            onRetry={handleRetry}
            showRetryButton={true}
            style={styles.errorContainer}
            errorType={getErrorType(state.error)}
          />
        )}
        
        {state.loading && state.products.length === 0 && !state.error ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" testID="loading-spinner" />
          </View>
        ) : !state.error ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            windowSize={8}
            initialNumToRender={4}
            updateCellsBatchingPeriod={50}
            legacyImplementation={false}
            refreshControl={
              <RefreshControl
                refreshing={state.loading && state.products.length > 0}
                onRefresh={fetchProducts}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
                testID="refresh-control"
              />
            }
            ListEmptyComponent={renderEmptyState}
            testID="product-list"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-around',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});