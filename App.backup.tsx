import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemeProvider, AppProvider, useTheme } from './src/contexts';
import { AppNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';

/**
 * Main App Content Component with Navigation and Error Boundaries
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
function AppContent() {
  const { theme } = useTheme();

  const handleNavigationError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Navigation Error:', error, errorInfo);
    Alert.alert(
      'Navigation Error',
      'There was a problem with navigation. The app will attempt to recover.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        style={theme.mode === 'dark' ? 'light' : 'dark'} 
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <ErrorBoundary 
        level="screen" 
        onError={handleNavigationError}
        resetKeys={[theme.mode]} // Reset on theme change
      >
        <AppNavigator />
      </ErrorBoundary>
    </View>
  );
}

/**
 * Root App Component with Context Providers and Multiple Error Boundaries
 * Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export default function App() {
  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Enhanced error logging for app-level errors
    console.error('App-level Error Boundary caught error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
    });

    // In production, report to crash analytics
    if (process.env.NODE_ENV === 'production') {
      // Example: crashlytics().recordError(error);
    }
  };

  const handleContextError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Context Provider Error:', error, errorInfo);
    Alert.alert(
      'App Initialization Error',
      'There was a problem starting the app. Please restart the application.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ErrorBoundary 
      level="app" 
      onError={handleAppError}
      resetOnPropsChange={false}
    >
      <SafeAreaProvider>
        <ErrorBoundary 
          level="component" 
          onError={handleContextError}
        >
          <ThemeProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
