/**
 * Central export file for all utility functions
 * This allows for clean imports throughout the application
 */

export {
  formatPrice,
  formatRating,
  truncateText,
  filterProductsByQuery,
  sortProducts,
  getUniqueCategories,
  isValidProduct,
} from './dataTransform';

export {
  createThemedStyles,
  getThemeShadow,
  getThemeBorder,
  getTextColor,
  getBackgroundColor,
  isDarkMode,
  getStatusBarStyle,
} from './themeUtils';

export {
  sampleProducts,
  demoContextUsage,
  filterProductsByQuery as filterProducts,
  isProductFavorite,
  getFavoriteProducts,
} from './contextDemo';