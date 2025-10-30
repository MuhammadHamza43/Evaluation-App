import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { reportError } from '../utils/errorMonitoring';

/**
 * ErrorBoundary Props Interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'screen' | 'component';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * ErrorBoundary State Interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree with enhanced error handling
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging with context
    const errorContext = {
      errorInfo,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      url: typeof window !== 'undefined' ? window.location?.href : 'react-native',
    };

    console.error('ErrorBoundary caught an error:', errorContext);

    this.setState({
      error,
      errorInfo,
    });

    // Report to error monitoring system
    const errorLevel = this.props.level === 'app' ? 'critical' : 
                      this.props.level === 'screen' ? 'high' : 'medium';
    
    reportError(
      error, 
      `ErrorBoundary (${this.props.level || 'component'})`,
      errorLevel,
      errorContext
    );

    // Call optional error handler with enhanced context
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }



  /**
   * Get user-friendly error message based on error type
   */
  private getUserFriendlyMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Connection problem detected. Please check your internet connection.';
    }
    
    if (message.includes('timeout')) {
      return 'The operation took too long to complete. Please try again.';
    }
    
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'The app is using too much memory. Please restart the app.';
    }
    
    if (message.includes('permission')) {
      return 'Permission denied. Please check app permissions in settings.';
    }
    
    if (message.includes('storage') || message.includes('quota')) {
      return 'Storage issue detected. Please free up some space and try again.';
    }

    // Default message for unknown errors
    return 'An unexpected error occurred. Our team has been notified.';
  };

  /**
   * Reset error boundary state
   */
  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    });
  };

  /**
   * Handle retry with progressive delay and limit
   */
  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      Alert.alert(
        'Multiple Failures',
        'The error persists after multiple attempts. Please restart the app or contact support.',
        [
          { text: 'Restart App', onPress: this.handleAppRestart },
          { text: 'Contact Support', onPress: this.handleContactSupport },
        ]
      );
      return;
    }

    // Progressive delay: 0ms, 1s, 2s, 4s
    const delay = retryCount > 0 ? Math.pow(2, retryCount - 1) * 1000 : 0;

    if (delay > 0) {
      // Show user that we're retrying with delay
      Alert.alert(
        'Retrying...',
        `Attempting to recover in ${delay / 1000} second${delay > 1000 ? 's' : ''}...`,
        [{ text: 'OK' }]
      );
    }

    this.resetTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);
  };

  /**
   * Handle app restart (placeholder - would use native restart in production)
   */
  private handleAppRestart = () => {
    // In production, this would trigger app restart
    // For now, just reload the page in web or show instruction for mobile
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      Alert.alert(
        'Restart Required',
        'Please close and reopen the app to continue.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle contact support
   */
  private handleContactSupport = () => {
    const { error, errorId } = this.state;
    const errorDetails = `Error ID: ${errorId}\nError: ${error?.message || 'Unknown error'}`;
    
    Alert.alert(
      'Contact Support',
      `Please provide this error information to support:\n\n${errorDetails}`,
      [
        { text: 'Copy Error ID', onPress: () => this.copyToClipboard(errorId) },
        { text: 'OK' }
      ]
    );
  };

  /**
   * Copy error ID to clipboard (placeholder)
   */
  private copyToClipboard = (text: string) => {
    // In production, this would use Clipboard API
    console.log('Error ID copied to clipboard:', text);
    Alert.alert('Copied', 'Error ID copied to clipboard');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, errorId } = this.state;
      const { level = 'component' } = this.props;
      const userMessage = error ? this.getUserFriendlyMessage(error) : 'An unexpected error occurred.';
      const isTablet = Dimensions.get('window').width > 768;

      // Different UI based on error boundary level
      const getErrorTitle = () => {
        switch (level) {
          case 'app':
            return 'App Error';
          case 'screen':
            return 'Screen Error';
          default:
            return 'Something went wrong';
        }
      };

      const getErrorIcon = () => {
        switch (level) {
          case 'app':
            return '🚨';
          case 'screen':
            return '⚠️';
          default:
            return '😕';
        }
      };

      return (
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          <View style={[styles.errorContainer, isTablet && styles.tabletErrorContainer]}>
            <Text style={[styles.errorIcon, isTablet && styles.tabletErrorIcon]}>
              {getErrorIcon()}
            </Text>
            
            <Text style={[styles.errorTitle, isTablet && styles.tabletErrorTitle]}>
              {getErrorTitle()}
            </Text>
            
            <Text style={[styles.errorMessage, isTablet && styles.tabletErrorMessage]}>
              {userMessage}
            </Text>

            {retryCount > 0 && (
              <Text style={[styles.retryInfo, isTablet && styles.tabletRetryInfo]}>
                Retry attempt: {retryCount}/3
              </Text>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <View style={[styles.debugContainer, isTablet && styles.tabletDebugContainer]}>
                <Text style={styles.debugTitle}>Debug Info (Development Only):</Text>
                <Text style={styles.debugText} numberOfLines={10}>
                  Error: {error.toString()}
                </Text>
                <Text style={styles.debugText} numberOfLines={5}>
                  Error ID: {errorId}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText} numberOfLines={10}>
                    Component Stack: {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.retryButton, isTablet && styles.tabletRetryButton]}
                onPress={this.handleRetry}
                testID="error-boundary-retry"
              >
                <Text style={[styles.retryButtonText, isTablet && styles.tabletRetryButtonText]}>
                  {retryCount > 0 ? 'Try Again' : 'Retry'}
                </Text>
              </TouchableOpacity>

              {level === 'app' && (
                <TouchableOpacity
                  style={[styles.supportButton, isTablet && styles.tabletSupportButton]}
                  onPress={this.handleContactSupport}
                  testID="error-boundary-support"
                >
                  <Text style={[styles.supportButtonText, isTablet && styles.tabletSupportButtonText]}>
                    Get Help
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  tabletContainer: {
    padding: 40,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
    minWidth: 300,
  },
  tabletErrorContainer: {
    padding: 48,
    maxWidth: 600,
    minWidth: 500,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  tabletErrorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabletErrorTitle: {
    fontSize: 32,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  tabletErrorMessage: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryInfo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tabletRetryInfo: {
    fontSize: 16,
    marginBottom: 20,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
  },
  tabletDebugContainer: {
    padding: 20,
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  tabletRetryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 140,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabletRetryButtonText: {
    fontSize: 18,
  },
  supportButton: {
    backgroundColor: '#f57c00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  tabletSupportButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 140,
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabletSupportButtonText: {
    fontSize: 18,
  },
});

export default ErrorBoundary;