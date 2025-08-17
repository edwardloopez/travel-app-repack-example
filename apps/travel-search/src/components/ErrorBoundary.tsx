import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'TravelSearch Error Boundary caught an error:',
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            We're sorry, but something unexpected happened in the search
            feature.
          </Text>
          {__DEV__ && this.state.error && (
            <Text variant="bodySmall" style={styles.error}>
              {this.state.error.message}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={this.handleReset}
            style={styles.button}
          >
            Try Again
          </Button>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 16,
  },
});

export default ErrorBoundary;
