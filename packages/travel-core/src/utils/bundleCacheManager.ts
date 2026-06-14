import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateVersionedCacheKey,
  getActiveRemoteConfig,
  getContainerUrl,
  type VersionedRemoteConfig,
} from '../utils/bundleVersioning';
import { mfTrace } from '../utils/mfTrace';
import { retryWithBackoff } from '../utils/retryWithBackoff';

/**
 * Bundle Cache Management Utilities
 *
 * Provides functions to manage cached bundles, handle updates,
 * and perform cache invalidation based on versions
 */

export class BundleCacheManager {
  private static readonly VERSION_PREFIX = 'bundle_version_';
  private static readonly CONTENT_PREFIX = 'bundle_content_';

  /**
   * Invalidate cache for a specific remote and platform
   */
  static async invalidateRemote(
    remoteName: string,
    platform: string,
    version?: string
  ): Promise<void> {
    try {
      if (version) {
        // Invalidate specific version
        const versionedKey = generateVersionedCacheKey(
          remoteName,
          platform,
          version
        );
        await Promise.all([
          AsyncStorage.removeItem(`${this.CONTENT_PREFIX}${versionedKey}`),
          AsyncStorage.removeItem(`${this.VERSION_PREFIX}${versionedKey}`),
        ]);
        console.log(
          `BundleCache: Invalidated ${remoteName} v${version} for ${platform}`
        );
      } else {
        // Invalidate all versions of this remote
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToDelete = allKeys.filter(key =>
          key.includes(`${remoteName}_${platform}`)
        );

        if (keysToDelete.length > 0) {
          await AsyncStorage.multiRemove(keysToDelete);
          console.log(
            `BundleCache: Invalidated all versions of ${remoteName} for ${platform}`
          );
        }
      }
    } catch (error) {
      console.error('BundleCache: Error invalidating cache:', error);
    }
  }

  /**
   * Invalidate all cached bundles
   */
  static async invalidateAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const bundleKeys = allKeys.filter(
        key =>
          key.startsWith(this.CONTENT_PREFIX) ||
          key.startsWith(this.VERSION_PREFIX)
      );

      if (bundleKeys.length > 0) {
        await AsyncStorage.multiRemove(bundleKeys);
        console.log(
          `BundleCache: Invalidated ${bundleKeys.length} cached bundles`
        );
      }

      // Also use ScriptManager's invalidation
      await ScriptManager.shared.invalidateScripts();
    } catch (error) {
      console.error('BundleCache: Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalBundles: number;
    totalSize: number;
    bundles: Array<{
      name: string;
      platform: string;
      version: string;
      size: number;
    }>;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const versionKeys = allKeys.filter(key =>
        key.startsWith(this.VERSION_PREFIX)
      );
      const contentKeys = allKeys.filter(key =>
        key.startsWith(this.CONTENT_PREFIX)
      );

      const bundles = [];
      let totalSize = 0;

      for (const versionKey of versionKeys) {
        const version = await AsyncStorage.getItem(versionKey);
        const contentKey = versionKey.replace(
          this.VERSION_PREFIX,
          this.CONTENT_PREFIX
        );
        const content = await AsyncStorage.getItem(contentKey);

        if (version && content) {
          const bundleKey = versionKey.replace(this.VERSION_PREFIX, '');
          const [, name, platform] = bundleKey.split('_');
          const size = content.length;

          bundles.push({
            name,
            platform,
            version,
            size,
          });

          totalSize += size;
        }
      }

      return {
        totalBundles: bundles.length,
        totalSize,
        bundles,
      };
    } catch (error) {
      console.error('BundleCache: Error getting cache stats:', error);
      return {
        totalBundles: 0,
        totalSize: 0,
        bundles: [],
      };
    }
  }

  /**
   * Check for bundle updates and invalidate outdated caches
   */
  static async checkForUpdates(
    remoteConfig: VersionedRemoteConfig = getActiveRemoteConfig()
  ): Promise<string[]> {
    const updatedRemotes: string[] = [];

    try {
      for (const [remoteName, config] of Object.entries(remoteConfig)) {
        const platforms = ['ios', 'android'];

        for (const platform of platforms) {
          const cacheKey = generateVersionedCacheKey(
            remoteName,
            platform,
            config.version
          );
          const cachedVersion = await AsyncStorage.getItem(
            `${this.VERSION_PREFIX}${cacheKey}`
          );

          if (cachedVersion && cachedVersion !== config.version) {
            // Version mismatch - invalidate old cache
            await this.invalidateRemote(remoteName, platform, cachedVersion);
            updatedRemotes.push(`${remoteName}@${platform}`);
            console.log(
              `BundleCache: Detected update for ${remoteName} (${cachedVersion} → ${config.version})`
            );
          }
        }
      }
    } catch (error) {
      console.error('BundleCache: Error checking for updates:', error);
    }

    return updatedRemotes;
  }

  /**
   * Preload specific bundles (useful for critical micro-frontends)
   */
  static async preloadBundles(
    remoteNames: string[],
    platform: string,
    remoteConfig: VersionedRemoteConfig = getActiveRemoteConfig()
  ): Promise<void> {
    try {
      const preloadPromises = remoteNames.map(async remoteName => {
        const config = remoteConfig[remoteName];
        if (!config) {
          console.warn(`BundleCache: No config found for ${remoteName}`);
          return;
        }

        try {
          const bundleUrl = getContainerUrl(remoteName, platform);
          const startedAt = Date.now();
          mfTrace('4.prefetch.script.start', { remoteName, bundleUrl });
          await retryWithBackoff(() =>
            ScriptManager.shared.prefetchScript(remoteName)
          );
          mfTrace('4.prefetch.script.ok', {
            remoteName,
            bundleUrl,
            durationMs: Date.now() - startedAt,
          });
        } catch (error) {
          mfTrace('4.prefetch.script.error', {
            remoteName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.error('BundleCache: Error preloading bundles:', error);
    }
  }
}

/**
 * React Hook for bundle cache management
 */
export function useBundleCache() {
  const invalidateRemote = (
    remoteName: string,
    platform: string,
    version?: string
  ) => BundleCacheManager.invalidateRemote(remoteName, platform, version);

  const invalidateAll = () => BundleCacheManager.invalidateAll();

  const getCacheStats = () => BundleCacheManager.getCacheStats();

  const checkForUpdates = (config?: VersionedRemoteConfig) =>
    BundleCacheManager.checkForUpdates(config);

  const preloadBundles = (
    remoteNames: string[],
    platform: string,
    config?: VersionedRemoteConfig
  ) => BundleCacheManager.preloadBundles(remoteNames, platform, config);

  return {
    invalidateRemote,
    invalidateAll,
    getCacheStats,
    checkForUpdates,
    preloadBundles,
  };
}
