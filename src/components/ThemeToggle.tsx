import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeToggle component props interface
 * Requirements: 6.1
 */
interface ThemeToggleProps {
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

/**
 * ThemeToggle Component
 * Animated toggle switch for theme switching with visual feedback
 * Requirements: 6.1
 */
const ThemeToggleComponent: React.FC<ThemeToggleProps> = ({
  style,
  size = 'medium',
}) => {
  const { theme, toggleTheme } = useTheme();
  const animatedValue = useRef(new Animated.Value(theme.mode === 'dark' ? 1 : 0)).current;

  // Size configurations
  const sizeConfig = {
    small: { width: 40, height: 20, thumbSize: 16, padding: 2 },
    medium: { width: 50, height: 25, thumbSize: 21, padding: 2 },
    large: { width: 60, height: 30, thumbSize: 26, padding: 2 },
  };

  const config = sizeConfig[size];

  // Animate toggle when theme changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: theme.mode === 'dark' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [theme.mode, animatedValue]);

  const handleToggle = () => {
    toggleTheme();
  };

  // Interpolate thumb position
  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.padding, config.width - config.thumbSize - config.padding],
  });

  // Interpolate background color
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  const dynamicStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleContainer: {
      width: config.width,
      height: config.height,
      borderRadius: config.height / 2,
      padding: config.padding,
      justifyContent: 'center',
    },
    thumb: {
      width: config.thumbSize,
      height: config.thumbSize,
      borderRadius: config.thumbSize / 2,
      backgroundColor: theme.colors.background,
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },

  });

  return (
    <View style={[dynamicStyles.container, style]} testID="theme-toggle" accessibilityLabel={theme.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      <TouchableOpacity
        onPress={handleToggle}
        testID="theme-toggle-button"
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            dynamicStyles.toggleContainer,
            { backgroundColor }
          ]}
        >
          <Animated.View
            style={[
              dynamicStyles.thumb,
              {
                transform: [{ translateX: thumbTranslateX }]
              }
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// Memoize ThemeToggle to prevent unnecessary re-renders
export const ThemeToggle = React.memo(ThemeToggleComponent);

export default ThemeToggle;