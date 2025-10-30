import { Product } from './Product';

/**
 * Global application state interface
 * Requirements: 2.1, 4.3
 */
export interface AppState {
  products: Product[];
  favorites: number[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

/**
 * Action types for state management using useReducer
 * Requirements: 2.1, 4.3
 */
export type AppAction = 
  | { type: 'FETCH_PRODUCTS_START' }
  | { type: 'FETCH_PRODUCTS_SUCCESS'; payload: Product[] }
  | { type: 'FETCH_PRODUCTS_ERROR'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: number }
  | { type: 'SET_FAVORITES'; payload: number[] }
  | { type: 'CLEAR_ERROR' };

/**
 * Initial state for the app reducer
 * Requirements: 2.1, 4.3
 */
export const initialAppState: AppState = {
  products: [],
  favorites: [],
  loading: false,
  error: null,
  searchQuery: '',
};