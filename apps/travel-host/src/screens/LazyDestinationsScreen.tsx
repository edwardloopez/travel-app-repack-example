import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, FederationErrorFallback } from 'travel-core';
import { Federated } from '@callstack/repack/client';

// Fallback component when micro-frontend is not available
const DestinationsFallback: React.FC = () => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackTitle}>🏛️ Destinations Service</Text>
    <Text style={styles.fallbackText}>
      Destinations micro-frontend is not available yet.{'\n'}
      Start the TravelDestinations app first: pnpm start:travel-destinations
    </Text>
  </View>
);

const DestinationsScreen = React.lazy(async () => {
  console.log('🌍 Loading Destinations micro-frontend...');
  try {
    // @ts-ignore - Federation module
    const module = await import('TravelDestinations/DestinationsScreen');

    if (!module || !module.default) {
      throw new Error('DestinationsScreen module not found');
    }

    console.log('✅ Destinations micro-frontend loaded successfully');
    return module;
  } catch (error) {
    console.error('❌ Failed to load Destinations micro-frontend:', error);
    return { default: DestinationsFallback };
  }
});

const LazyDestinationsScreen: React.FC = () => {
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
            <Text style={styles.loadingText}>Loading Destinations...</Text>
          </View>
        }
      >
        <DestinationsScreen />
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

export default LazyDestinationsScreen;
