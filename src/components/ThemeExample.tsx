import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts';
import { createThemedStyles, getThemeShadow } from '../utils';

/**
 * Example component demonstrating theme usage
 * This is a temporary component to validate theme implementation
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
const ThemeExample: React.FC = () => {
  const { theme } = useTheme();
  const styles = createThemedStyles(getStyles)(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme Example</Text>
      <Text style={styles.subtitle}>Current theme: {theme.mode}</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>This is a themed card</Text>
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xlarge,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: 8,
    ...getThemeShadow(theme, 'medium'),
  },
  cardText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
  },
});

export default ThemeExample;