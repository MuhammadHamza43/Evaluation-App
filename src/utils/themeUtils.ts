import { Theme } from '../types';

/**
 * Utility functions for theme-aware styling
 * Requirements: 6.2, 6.3, 6.5
 */

/**
 * Create theme-aware styles helper
 * Returns a function that takes theme and returns styles
 */
export const createThemedStyles = <T>(
  styleFunction: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFunction(theme);
};

/**
 * Get shadow styles based on theme mode
 * Light theme uses darker shadows, dark theme uses lighter shadows
 * Requirements: 6.2, 6.3
 */
export const getThemeShadow = (theme: Theme, elevation: 'low' | 'medium' | 'high' = 'medium') => {
  const isLight = theme.mode === 'light';

  const shadows = {
    low: {
      shadowColor: isLight ? '#000000' : '#FFFFFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isLight ? 0.1 : 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: isLight ? '#000000' : '#FFFFFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLight ? 0.15 : 0.08,
      shadowRadius: 4,
      elevation: 4,
    },
    high: {
      shadowColor: isLight ? '#000000' : '#FFFFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isLight ? 0.2 : 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
  };

  return shadows[elevation];
};

/**
 * Get border styles based on theme
 * Requirements: 6.2, 6.3
 */
export const getThemeBorder = (theme: Theme, width: number = 1) => ({
  borderWidth: width,
  borderColor: theme.colors.border,
});

/**
 * Get text color based on variant and theme
 * Requirements: 6.2, 6.3, 6.5
 */
export const getTextColor = (theme: Theme, variant: 'primary' | 'secondary' | 'error' | 'success' = 'primary') => {
  switch (variant) {
    case 'primary':
      return theme.colors.text;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'error':
      return theme.colors.error;
    case 'success':
      return theme.colors.success;
    default:
      return theme.colors.text;
  }
};

/**
 * Get background color based on surface type and theme
 * Requirements: 6.2, 6.3
 */
export const getBackgroundColor = (theme: Theme, surface: 'main' | 'surface' | 'card' = 'main') => {
  switch (surface) {
    case 'main':
      return theme.colors.background;
    case 'surface':
      return theme.colors.surface;
    case 'card':
      return theme.colors.cardBackground;
    default:
      return theme.colors.background;
  }
};

/**
 * Check if current theme is dark mode
 * Requirements: 6.2, 6.3
 */
export const isDarkMode = (theme: Theme): boolean => theme.mode === 'dark';

/**
 * Get appropriate status bar style for theme
 * Requirements: 6.2, 6.3, 6.5
 */
export const getStatusBarStyle = (theme: Theme): 'light-content' | 'dark-content' => {
  return theme.mode === 'dark' ? 'light-content' : 'dark-content';
};