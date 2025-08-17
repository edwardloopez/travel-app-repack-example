import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, FederationErrorFallback } from 'travel-core';

const WeatherFallback: React.FC = () => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackTitle}>🌤️ Weather Service</Text>
    <Text style={styles.fallbackText}>
      Weather micro-frontend is not available yet.{'\n'}
      Start the TravelWeather app first: pnpm start:travel-weather
    </Text>
  </View>
);

const WeatherScreen = React.lazy(async () => {
  console.log('🌤️ Loading Weather micro-frontend...');
  try {
    //@ts-ignore
    const module = await import('TravelWeather/WeatherScreen');

    if (!module || !module.default) {
      throw new Error('WeatherScreen module not found');
    }

    console.log('✅ Weather micro-frontend loaded successfully');
    return module;
  } catch (error) {
    console.log('❌ Failed to load Weather micro-frontend:', error);
    return { default: WeatherFallback };
  }
});

const LazyWeatherScreen: React.FC = () => {
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
            <Text style={styles.loadingText}>Loading Weather...</Text>
          </View>
        }
      >
        <WeatherScreen />
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

export default LazyWeatherScreen;
