import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingSpinner component props interface
 * Requirements: 2.2
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * LoadingSpinner Component
 * Animated loading indicator with theme support and customization options
 * Requirements: 2.2
 */
const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  style,
  testID = 'loading-spinner',
}) => {
  const { theme } = useTheme();

  // Use provided color or fallback to theme primary color
  const spinnerColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={spinnerColor}
        testID={testID}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

// Memoize LoadingSpinner to prevent unnecessary re-renders
export const LoadingSpinner = React.memo(LoadingSpinnerComponent);

export default LoadingSpinner;