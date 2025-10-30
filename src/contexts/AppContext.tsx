import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AppState, AppAction, initialAppState, Product } from '../types';
import { StorageService } from '../services/StorageService';

/**
 * App Context interface for global state management
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions for common operations
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (productId: number) => Promise<void>;
  clearError: () => void;
}

/**
 * App reducer function to handle state updates
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'FETCH_PRODUCTS_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'FETCH_PRODUCTS_SUCCESS':
      return {
        ...state,
        loading: false,
        products: action.payload,
        error: null,
      };

    case 'FETCH_PRODUCTS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'TOGGLE_FAVORITE': {
      const productId = action.payload;
      const isFavorite = state.favorites.includes(productId);
      
      return {
        ...state,
        favorites: isFavorite
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId],
      };
    }

    case 'SET_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * App Context Provider component
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Load favorites from storage on app initialization
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await StorageService.getFavorites();
        dispatch({ type: 'SET_FAVORITES', payload: savedFavorites });
      } catch (error) {
        console.error('Failed to load favorites from storage:', error);
        // Continue with empty favorites array if loading fails
      }
    };

    loadFavorites();
  }, []);

  // Persist favorites to storage whenever favorites state changes
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        // Only save if we have loaded initial favorites (avoid saving empty array on first render)
        if (state.favorites.length > 0 || state.products.length > 0) {
          // Save each favorite individually to maintain data integrity
          const currentStoredFavorites = await StorageService.getFavorites();
          
          // Find favorites to add
          const favoritesToAdd = state.favorites.filter(id => !currentStoredFavorites.includes(id));
          
          // Find favorites to remove
          const favoritesToRemove = currentStoredFavorites.filter(id => !state.favorites.includes(id));
          
          // Add new favorites
          for (const favoriteId of favoritesToAdd) {
            await StorageService.addFavorite(favoriteId);
          }
          
          // Remove old favorites
          for (const favoriteId of favoritesToRemove) {
            await StorageService.removeFavorite(favoriteId);
          }
        }
      } catch (error) {
        console.error('Failed to save favorites to storage:', error);
        // Don't throw error to avoid breaking the app
      }
    };

    saveFavorites();
  }, [state.favorites, state.products.length]);

  // Helper functions for common operations - memoized to prevent unnecessary re-renders
  const setProducts = useCallback((products: Product[]) => {
    dispatch({ type: 'FETCH_PRODUCTS_SUCCESS', payload: products });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      dispatch({ type: 'FETCH_PRODUCTS_START' });
    }
    // Note: loading false is handled by success/error actions
  }, []);

  const setError = useCallback((error: string | null) => {
    if (error) {
      dispatch({ type: 'FETCH_PRODUCTS_ERROR', payload: error });
    } else {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const toggleFavorite = useCallback(async (productId: number) => {
    try {
      // Update local state immediately for responsive UI
      dispatch({ type: 'TOGGLE_FAVORITE', payload: productId });
      
      // The useEffect will handle persistence to storage
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert the state change if storage operation fails
      dispatch({ type: 'TOGGLE_FAVORITE', payload: productId });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    setProducts,
    setLoading,
    setError,
    setSearchQuery,
    toggleFavorite,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to use the App Context
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}

/**
 * Hook to get filtered products based on search query
 * Requirements: 3.2, 3.3
 */
export function useFilteredProducts(): Product[] {
  const { state } = useApp();
  const { products, searchQuery } = state;

  return useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    return products.filter(product =>
      product.title.toLowerCase().includes(lowercaseQuery)
    );
  }, [products, searchQuery]);
}

/**
 * Hook to check if a product is favorited
 * Requirements: 5.1, 5.2
 */
export function useIsFavorite(productId: number): boolean {
  const { state } = useApp();
  return useMemo(() => {
    return state.favorites.includes(productId);
  }, [state.favorites, productId]);
}

export default AppContext;