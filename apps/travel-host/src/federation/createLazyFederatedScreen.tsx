import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, FederationErrorFallback } from 'travel-core';

export interface LazyFederatedScreenOptions {
  remoteName: string;
  moduleName: string;
  loadingLabel: string;
  fallbackTitle: string;
  fallbackIcon?: string;
  startCommand: string;
}

export function createLazyFederatedScreen({
  remoteName,
  moduleName,
  loadingLabel,
  fallbackTitle,
  fallbackIcon = '⚠️',
  startCommand,
}: LazyFederatedScreenOptions) {
  const Fallback: React.FC = () => (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>
        {fallbackIcon} {fallbackTitle}
      </Text>
      <Text style={styles.fallbackText}>
        Micro-frontend is not available yet.{'\n'}
        Start it first: {startCommand}
      </Text>
    </View>
  );

  const FederatedScreen = React.lazy(async () => {
    console.log(`Loading ${remoteName}/${moduleName}...`);
    try {
      // Static remote imports are required for Module Federation resolution.
      let module: { default: React.ComponentType };
      switch (`${remoteName}/${moduleName}`) {
        case 'TravelWeather/WeatherScreen':
          module = await import('TravelWeather/WeatherScreen');
          break;
        case 'TravelDestinations/DestinationsScreen':
          module = await import('TravelDestinations/DestinationsScreen');
          break;
        case 'TravelSearch/SearchScreen':
          module = await import('TravelSearch/SearchScreen');
          break;
        case 'TravelPhotos/PhotosScreen':
          module = await import('TravelPhotos/PhotosScreen');
          break;
        default:
          throw new Error(`Unknown federated module ${remoteName}/${moduleName}`);
      }

      if (!module?.default) {
        throw new Error(`${moduleName} module not found`);
      }

      console.log(`Loaded ${remoteName}/${moduleName} successfully`);
      return module;
    } catch (error) {
      console.log(`Failed to load ${remoteName}/${moduleName}:`, error);
      return { default: Fallback };
    }
  });

  const LazyScreen: React.FC = () => (
    <ErrorBoundary
      fallback={<FederationErrorFallback />}
      onError={(error, errorInfo) => {
        console.log('Federation error:', error.message, errorInfo);
      }}
    >
      <React.Suspense
        fallback={
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading {loadingLabel}...</Text>
          </View>
        }
      >
        <FederatedScreen />
      </React.Suspense>
    </ErrorBoundary>
  );

  return LazyScreen;
}

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
