import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, FederationErrorFallback } from 'travel-core';

// Fallback component when micro-frontend is not available
const SearchFallback: React.FC = () => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackTitle}>🔍 Search Service</Text>
    <Text style={styles.fallbackText}>
      Search micro-frontend is not available yet.{'\n'}
      Start the TravelSearch app first: pnpm start:travel-search
    </Text>
  </View>
);

const SearchScreen = React.lazy(async () => {
  console.log('✈️ Loading Search micro-frontend...');
  try {
    // @ts-ignore - Federation module
    const module = await import('TravelSearch/SearchScreen');

    if (!module || !module.default) {
      throw new Error('SearchScreen module not found');
    }

    return module;
  } catch (error) {
    console.error('❌ Failed to load Search micro-frontend:', error);
    return { default: SearchFallback };
  }
});

const LazySearchScreen: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={<FederationErrorFallback />}
      onError={(error, errorInfo) => {
        console.log('🔴 Federation Error caught:', error.message);
        console.log('🔴 Error Info:', errorInfo);
      }}
    >
      <React.Suspense
        fallback={
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading Search...</Text>
          </View>
        }
      >
        <SearchScreen />
      </React.Suspense>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B00020',
    marginBottom: 10,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LazySearchScreen;
