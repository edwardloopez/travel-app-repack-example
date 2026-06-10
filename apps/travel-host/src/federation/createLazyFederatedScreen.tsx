import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BundleCacheManager,
  ErrorBoundary,
  FederationErrorFallback,
} from 'travel-core';

export interface LazyFederatedScreenOptions {
  remoteName: string;
  moduleName: string;
  loadingLabel: string;
  fallbackTitle: string;
  fallbackIcon?: string;
  startCommand: string;
}

async function loadFederatedModule(
  remoteName: string,
  moduleName: string
): Promise<React.ComponentType> {
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

  return module.default;
}

export function createLazyFederatedScreen({
  remoteName,
  moduleName,
  loadingLabel,
  fallbackTitle,
  fallbackIcon = '⚠️',
  startCommand,
}: LazyFederatedScreenOptions) {
  const FederatedScreenLoader: React.FC = () => {
    const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
    const [Screen, setScreen] = useState<React.ComponentType | null>(null);
    const [attempt, setAttempt] = useState(0);

    const loadScreen = useCallback(async () => {
      setPhase('loading');
      console.log(`Loading ${remoteName}/${moduleName}...`);

      try {
        const Component = await loadFederatedModule(remoteName, moduleName);
        setScreen(() => Component);
        setPhase('ready');
        console.log(`Loaded ${remoteName}/${moduleName} successfully`);
      } catch (error) {
        console.log(`Failed to load ${remoteName}/${moduleName}:`, error);
        setScreen(null);
        setPhase('error');
      }
    }, []);

    useEffect(() => {
      loadScreen();
    }, [loadScreen, attempt]);

    const handleRetry = async () => {
      await BundleCacheManager.invalidateRemote(remoteName, Platform.OS);
      setAttempt(current => current + 1);
    };

    if (phase === 'loading') {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading {loadingLabel}...</Text>
        </View>
      );
    }

    if (phase === 'error' || !Screen) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>
            {fallbackIcon} {fallbackTitle}
          </Text>
          <Text style={styles.fallbackText}>
            Micro-frontend is not available yet.{'\n'}
            Start it first: {startCommand}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry download</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Screen />;
  };

  const LazyScreen: React.FC = () => (
    <ErrorBoundary
      fallback={<FederationErrorFallback />}
      onError={(error, errorInfo) => {
        console.log('Federation error:', error.message, errorInfo);
      }}
    >
      <FederatedScreenLoader />
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
