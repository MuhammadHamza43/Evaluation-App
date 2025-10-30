/**
 * Context exports for centralized access
 * Requirements: 2.1, 3.2, 3.3, 5.1, 5.2, 6.1, 6.2, 6.3
 */

export { ThemeProvider, useTheme, lightTheme, darkTheme } from './ThemeContext';
export type { ThemeContextState } from '../types';

export { 
  AppProvider, 
  useApp, 
  useFilteredProducts, 
  useIsFavorite 
} from './AppContext';
export type { AppState, AppAction } from '../types';