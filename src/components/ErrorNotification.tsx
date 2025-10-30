/**
 * Error notification component for displaying user-friendly error messages
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorNotificationProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  position?: 'top' | 'bottom';
}

/**
 * ErrorNotification Component
 * Displays dismissible error notifications with retry functionality
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  visible,
  message,
  type = 'error',
  duration = 5000,
  onDismiss,
  onRetry,
  showRetry = false,
  position = 'top',
}) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(position === 'top' ? -100 : 100));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'top' ? -100 : 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, fadeAnim, slideAnim, position]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleDismiss();
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#ff9800';
      case 'info':
        return theme.colors.primary;
      default:
        return theme.colors.error;
    }
  };

  const getNotificationIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  if (!visible) {
    return null;
  }

  const notificationColor = getNotificationColor();
  const screenWidth = Dimensions.get('window').width;

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: position === 'top' ? 50 : undefined,
      bottom: position === 'bottom' ? 50 : undefined,
      left: 16,
      right: 16,
      zIndex: 1000,
      maxWidth: screenWidth - 32,
    },
    notification: {
      backgroundColor: theme.colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: notificationColor,
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    icon: {
      fontSize: 20,
    },
    textContainer: {
      flex: 1,
    },
    message: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: showRetry ? 12 : 0,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    button: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      minWidth: 60,
      alignItems: 'center',
    },
    dismissButton: {
      backgroundColor: theme.colors.border,
    },
    retryButton: {
      backgroundColor: notificationColor,
    },
    buttonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    dismissButtonText: {
      color: theme.colors.textSecondary,
    },
    retryButtonText: {
      color: '#ffffff',
    },
    closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 4,
    },
    closeButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <Animated.View
      style={[
        dynamicStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={dynamicStyles.notification}>
        <TouchableOpacity
          style={dynamicStyles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={dynamicStyles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.content}>
          <View style={dynamicStyles.iconContainer}>
            <Text style={dynamicStyles.icon}>{getNotificationIcon()}</Text>
          </View>

          <View style={dynamicStyles.textContainer}>
            <Text style={dynamicStyles.message}>{message}</Text>

            {showRetry && (
              <View style={dynamicStyles.buttonContainer}>
                <TouchableOpacity
                  style={[dynamicStyles.button, dynamicStyles.dismissButton]}
                  onPress={handleDismiss}
                >
                  <Text style={[dynamicStyles.buttonText, dynamicStyles.dismissButtonText]}>
                    Dismiss
                  </Text>
                </TouchableOpacity>

                {onRetry && (
                  <TouchableOpacity
                    style={[dynamicStyles.button, dynamicStyles.retryButton]}
                    onPress={handleRetry}
                  >
                    <Text style={[dynamicStyles.buttonText, dynamicStyles.retryButtonText]}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default ErrorNotification;