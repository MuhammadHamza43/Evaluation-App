/**
 * Theme mode type for light/dark theme switching
 * Requirements: 6.2, 6.3
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Color scheme interface for theme colors
 * Requirements: 6.2, 6.3
 */
export interface ColorScheme {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  accent: string;
  cardBackground: string;
}

/**
 * Spacing values interface for consistent layout
 * Requirements: 6.2, 6.3
 */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Typography interface for text styling
 * Requirements: 6.2, 6.3
 */
export interface Typography {
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  fontWeight: {
    normal: string;
    bold: string;
  };
  lineHeight: {
    small: number;
    medium: number;
    large: number;
  };
}

/**
 * Complete theme interface with all styling properties
 * Requirements: 6.2, 6.3
 */
export interface Theme {
  mode: ThemeMode;
  colors: ColorScheme;
  spacing: Spacing;
  typography: Typography;
}

/**
 * Theme context state interface
 * Requirements: 6.2, 6.3
 */
export interface ThemeContextState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}