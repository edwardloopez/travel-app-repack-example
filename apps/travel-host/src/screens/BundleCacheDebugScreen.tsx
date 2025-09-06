import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useBundleCache, loadRemoteConfig } from 'travel-core';
import type { VersionedRemoteConfig } from 'travel-core';

/**
 * Bundle Cache Debug Screen
 *
 * Provides developer tools for managing bundle cache and versions
 * Only available in development builds
 */
const BundleCacheDebugScreen: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [remoteConfig, setRemoteConfig] = useState<VersionedRemoteConfig>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    invalidateRemote,
    invalidateAll,
    getCacheStats,
    checkForUpdates,
    preloadBundles,
  } = useBundleCache();

  const loadData = async () => {
    try {
      const [stats, config] = await Promise.all([
        getCacheStats(),
        loadRemoteConfig(),
      ]);

      setCacheStats(stats);
      setRemoteConfig(config);
    } catch (error) {
      console.error('Error loading cache data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleInvalidateAll = () => {
    Alert.alert(
      'Clear All Cache',
      'This will remove all cached bundles. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await invalidateAll();
            await loadData();
            Alert.alert('Success', 'All cached bundles cleared');
          },
        },
      ]
    );
  };

  const handleInvalidateRemote = (remoteName: string, platform: string) => {
    Alert.alert(
      'Clear Remote Cache',
      `Clear cache for ${remoteName} (${platform})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await invalidateRemote(remoteName, platform);
            await loadData();
            Alert.alert('Success', `Cache cleared for ${remoteName}`);
          },
        },
      ]
    );
  };

  const handleCheckUpdates = async () => {
    try {
      const updatedRemotes = await checkForUpdates(remoteConfig);

      if (updatedRemotes.length > 0) {
        Alert.alert(
          'Updates Found',
          `Updated remotes: ${updatedRemotes.join(', ')}`
        );
      } else {
        Alert.alert('No Updates', 'All bundles are up to date');
      }

      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to check for updates');
    }
  };

  const handlePreloadBundles = async () => {
    try {
      const remoteNames = Object.keys(remoteConfig);
      await preloadBundles(remoteNames, 'ios', remoteConfig);

      Alert.alert('Success', 'Bundles preloaded');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to preload bundles');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading cache information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bundle Cache Statistics</Text>
        {cacheStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statText}>
              Total Bundles: {cacheStats.totalBundles}
            </Text>
            <Text style={styles.statText}>
              Total Size: {formatBytes(cacheStats.totalSize)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={handleCheckUpdates}>
          <Text style={styles.buttonText}>Check for Updates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlePreloadBundles}>
          <Text style={styles.buttonText}>Preload All Bundles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleInvalidateAll}
        >
          <Text style={[styles.buttonText, styles.dangerText]}>
            Clear All Cache
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cached Bundles</Text>
        {cacheStats?.bundles.map((bundle: any, index: number) => (
          <View key={index} style={styles.bundleItem}>
            <View style={styles.bundleInfo}>
              <Text style={styles.bundleName}>
                {bundle.name} ({bundle.platform})
              </Text>
              <Text style={styles.bundleDetails}>
                Version: {bundle.version} • Size: {formatBytes(bundle.size)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() =>
                handleInvalidateRemote(bundle.name, bundle.platform)
              }
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ))}

        {(!cacheStats?.bundles || cacheStats.bundles.length === 0) && (
          <Text style={styles.emptyText}>No cached bundles</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remote Configuration</Text>
        {Object.entries(remoteConfig).map(([name, config]) => (
          <View key={name} style={styles.configItem}>
            <Text style={styles.configName}>{name}</Text>
            <Text style={styles.configDetails}>Version: {config.version}</Text>
            <Text style={styles.configDetails}>URL: {config.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    marginTop: 8,
  },
  statText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerText: {
    color: 'white',
  },
  bundleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bundleDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 16,
  },
  configItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  configName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  configDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default BundleCacheDebugScreen;
