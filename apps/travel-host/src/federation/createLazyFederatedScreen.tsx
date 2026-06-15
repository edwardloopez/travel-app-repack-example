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
  mfTrace,
} from 'travel-core';

export type FederatedModuleLoader = () => Promise<{
  default: React.ComponentType;
}>;

export interface LazyFederatedScreenOptions {
  remoteName: string;
  loadModule: FederatedModuleLoader;
  /** Used in logs only; the static import lives in loadModule. */
  moduleName?: string;
  loadingLabel: string;
  fallbackTitle: string;
  fallbackIcon?: string;
  startCommand: string;
}

function FederationFallback({
  fallbackIcon,
  fallbackTitle,
  startCommand,
  onRetry,
}: {
  fallbackIcon: string;
  fallbackTitle: string;
  startCommand: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>
        {fallbackIcon} {fallbackTitle}
      </Text>
      <Text style={styles.fallbackText}>
        Micro-frontend is not available yet.{'\n'}
        Start it first: {startCommand}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry download</Text>
      </TouchableOpacity>
    </View>
  );
}

export function createLazyFederatedScreen({
  remoteName,
  loadModule,
  moduleName,
  loadingLabel,
  fallbackTitle,
  fallbackIcon = '⚠️',
  startCommand,
}: LazyFederatedScreenOptions) {
  const federatedId = moduleName ? `${remoteName}/${moduleName}` : remoteName;

  const FederatedScreenLoader: React.FC = () => {
    const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
    const [Screen, setScreen] = useState<React.ComponentType | null>(null);
    const [attempt, setAttempt] = useState(0);

    const loadScreen = useCallback(async () => {
      setPhase('loading');
      const startedAt = Date.now();
      mfTrace('9.lazyScreen.load.start', { federatedId, remoteName, attempt });

      try {
        const module = await loadModule();
        if (!module?.default) {
          throw new Error(`${federatedId} module not found`);
        }
        setScreen(() => module.default);
        setPhase('ready');
        mfTrace('9.lazyScreen.load.ok', {
          federatedId,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        mfTrace('9.lazyScreen.load.error', {
          federatedId,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        });
        setScreen(null);
        setPhase('error');
      }
    }, [attempt, federatedId, remoteName]);

    useEffect(() => {
      loadScreen();
    }, [loadScreen]);

    const handleRetry = async () => {
      mfTrace('9.lazyScreen.retry', { remoteName, platform: Platform.OS });
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
        <FederationFallback
          fallbackIcon={fallbackIcon}
          fallbackTitle={fallbackTitle}
          startCommand={startCommand}
          onRetry={handleRetry}
        />
      );
    }

    return <Screen />;
  };

  const LazyScreen: React.FC = () => (
    <ErrorBoundary
      fallback={<FederationErrorFallback />}
      onError={(error, errorInfo) => {
        if (__DEV__) {
          mfTrace('9.lazyScreen.render.error', {
            federatedId,
            error: error.message,
          });
          return;
        }
        console.error('Federation render error:', error.message, errorInfo);
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
