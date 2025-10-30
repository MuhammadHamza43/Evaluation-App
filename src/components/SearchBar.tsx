import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Text 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SearchBar component props interface
 * Requirements: 3.1, 3.2
 */
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  debounceMs?: number;
}

/**
 * SearchBar Component
 * Text input with search functionality, debounced input handling, and theme support
 * Requirements: 3.1, 3.2
 */
const SearchBarComponent: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search products...',
  style,
  debounceMs = 300,
}) => {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value);

  // Debounced search handler
  const debouncedOnChangeText = useCallback(
    (searchText: string) => {
      const timeoutId = setTimeout(() => {
        onChangeText(searchText);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [onChangeText, debounceMs]
  );

  // Handle text input changes with debouncing
  useEffect(() => {
    const cleanup = debouncedOnChangeText(localValue);
    return cleanup;
  }, [localValue, debouncedOnChangeText]);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextChange = (text: string) => {
    setLocalValue(text);
  };

  const handleClear = () => {
    setLocalValue('');
    onChangeText('');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      margin: theme.spacing.sm,
    },
    searchIcon: {
      marginRight: theme.spacing.xs,
    },
    searchIconText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    textInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.medium,
      color: theme.colors.text,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    clearButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
    clearButtonText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.fontWeight.bold as any,
    },
  });

  return (
    <View style={[dynamicStyles.container, style]} testID="search-bar">
      <View style={dynamicStyles.searchIcon}>
        <Text style={dynamicStyles.searchIconText}>🔍</Text>
      </View>
      <TextInput
        style={dynamicStyles.textInput}
        value={localValue}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        testID="search-input"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {localValue.length > 0 && (
        <TouchableOpacity
          style={dynamicStyles.clearButton}
          onPress={handleClear}
          testID="clear-button"
          activeOpacity={0.7}
        >
          <Text style={dynamicStyles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Memoize SearchBar to prevent unnecessary re-renders
export const SearchBar = React.memo(SearchBarComponent);

export default SearchBar;