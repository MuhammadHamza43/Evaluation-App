import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Theme, ThemeMode, ThemeContextState, ColorScheme, Spacing, Typography } from '../types';
import { StorageService } from '../services';

/**
 * Theme definitions for light and dark modes
 * Requirements: 6.2, 6.3
 */

// Spacing values for consistent layout
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Typography definitions
const typography: Typography = {
  fontSize: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
  },
  fontWeight: {
    normal: '400',
    bold: '600',
  },
  lineHeight: {
    small: 16,
    medium: 22,
    large: 28,
  },
};

// Light theme color scheme
const lightColors: ColorScheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  accent: '#FF9500',
  cardBackground: '#FFFFFF',
};

// Dark theme color scheme
const darkColors: ColorScheme = {
  primary: '#0A84FF',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  accent: '#FF9F0A',
  cardBackground: '#2C2C2E',
};

// Theme objects
const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  typography,
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  typography,
};

/**
 * Theme reducer for state management
 * Requirements: 6.1, 6.2, 6.3
 */
interface ThemeState {
  currentTheme: Theme;
  isLoading: boolean;
}

type ThemeAction = 
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'TOGGLE_THEME' }
  | { type: 'THEME_LOADED'; payload: ThemeMode };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        currentTheme: action.payload === 'dark' ? darkTheme : lightTheme,
        isLoading: false,
      };
    case 'TOGGLE_THEME': {
      const newMode = state.currentTheme.mode === 'light' ? 'dark' : 'light';
      return {
        ...state,
        currentTheme: newMode === 'dark' ? darkTheme : lightTheme,
      };
    }
    case 'THEME_LOADED':
      return {
        ...state,
        currentTheme: action.payload === 'dark' ? darkTheme : lightTheme,
        isLoading: false,
      };
    default:
      return state;
  }
};

/**
 * Theme Context
 * Requirements: 6.1, 6.2, 6.3
 */
const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * Manages theme state and persistence
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, {
    currentTheme: lightTheme,
    isLoading: true,
  });

  /**
   * Load saved theme preference on app start
   * Requirements: 6.4
   */
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await StorageService.getTheme();
        dispatch({ type: 'THEME_LOADED', payload: savedTheme });
      } catch (error) {
        console.error('Error loading saved theme:', error);
        // Fallback to light theme
        dispatch({ type: 'THEME_LOADED', payload: 'light' });
      }
    };

    loadSavedTheme();
  }, []);

  /**
   * Set theme mode and persist to storage
   * Requirements: 6.1, 6.4
   */
  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      await StorageService.setTheme(mode);
      dispatch({ type: 'SET_THEME', payload: mode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Still update the theme in memory even if storage fails
      dispatch({ type: 'SET_THEME', payload: mode });
    }
  }, []);

  /**
   * Toggle between light and dark themes
   * Requirements: 6.1, 6.5
   */
  const toggleTheme = useCallback(async () => {
    const newMode = state.currentTheme.mode === 'light' ? 'dark' : 'light';
    await setTheme(newMode);
  }, [state.currentTheme.mode, setTheme]);

  const contextValue: ThemeContextState = {
    theme: state.currentTheme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * Requirements: 6.1, 6.2, 6.3
 */
export const useTheme = (): ThemeContextState => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

/**
 * Export theme objects for direct access if needed
 */
export { lightTheme, darkTheme };
export default ThemeContext;