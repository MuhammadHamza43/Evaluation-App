import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ErrorMessage component props interface
 * Requirements: 2.4, 7.1, 7.4
 */
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
  showRetryButton?: boolean;
  errorType?: 'network' | 'server' | 'timeout' | 'generic';
}

/**
 * ErrorMessage Component
 * Displays error states with retry functionality and theme-aware styling
 * Requirements: 2.4, 7.1, 7.4
 */
const ErrorMessageComponent: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  style,
  showRetryButton = true,
  errorType = 'generic',
}) => {
  const { theme } = useTheme();

  // Get appropriate retry button text based on error type
  const getRetryButtonText = () => {
    switch (errorType) {
      case 'network':
        return 'Check Connection';
      case 'timeout':
        return 'Try Again';
      case 'server':
        return 'Retry';
      default:
        return 'Try Again';
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.error,
      borderWidth: 1,
      borderRadius: 8,
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: theme.typography.fontWeight.normal as any,
      textAlign: 'center',
      marginBottom: onRetry && showRetryButton ? theme.spacing.sm : 0,
      lineHeight: theme.typography.lineHeight.medium,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 6,
      marginTop: theme.spacing.sm,
    },
    retryButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: theme.typography.fontWeight.bold as any,
      textAlign: 'center',
    },
  });

  return (
    <View style={[dynamicStyles.container, style]} testID="error-message">
      <Text style={dynamicStyles.errorText} testID="error-text">
        {message}
      </Text>
      {onRetry && showRetryButton && (
        <TouchableOpacity
          style={dynamicStyles.retryButton}
          onPress={onRetry}
          testID="retry-button"
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.retryButtonText}>
            {getRetryButtonText()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Memoize ErrorMessage to prevent unnecessary re-renders
export const ErrorMessage = React.memo(ErrorMessageComponent);

export default ErrorMessage;