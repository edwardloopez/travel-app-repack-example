import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  extractPlatformFromUrl,
  extractRemoteNameFromUrl,
  generateVersionedCacheKey,
  getActiveRemoteConfig,
  getContainerUrl,
  getRemoteVersion,
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

export type BundleCacheStats = {
  totalBundles: number;
  totalSize: number;
  cacheDisabled: boolean;
  bundles: Array<{
    name: string;
    platform: string;
    version: string;
    size: number;
    url?: string;
  }>;
};

type CacheChangeListener = () => void;
const cacheChangeListeners = new Set<CacheChangeListener>();

/** Called when ScriptManager persists cache metadata to storage. */
export function notifyBundleCacheChanged(): void {
  cacheChangeListeners.forEach(listener => listener());
}

export class BundleCacheManager {
  private static readonly VERSION_PREFIX = 'bundle_version_';
  private static readonly CONTENT_PREFIX = 'bundle_content_';
  /** Re.Pack ScriptManager metadata key (bundle files live on native FS). */
  private static readonly SCRIPT_MANAGER_CACHE_KEY = `Repack.ScriptManager.Cache.v4.${
    __DEV__ ? 'debug' : 'release'
  }`;

  static isScriptManagerCacheKey(key: string): boolean {
    return key.startsWith('Repack.ScriptManager.Cache');
  }

  /**
   * Subscribe to ScriptManager cache changes (loads, prefetch, invalidation).
   */
  static subscribeToScriptCacheChanges(onChange: () => void): () => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debounced = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        onChange();
      }, 200);
    };

    cacheChangeListeners.add(debounced);

    const events = ['loaded', 'invalidated'] as const;
    events.forEach(event => ScriptManager.shared.on(event, debounced));

    return () => {
      cacheChangeListeners.delete(debounced);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => ScriptManager.shared.off(event, debounced));
    };
  }

  private static parseScriptManagerCacheEntry(
    uniqueId: string,
    entry: { url?: string }
  ): {
    name: string;
    platform: string;
    version: string;
    size: number;
    url: string;
  } | null {
    const url = entry.url;
    if (!url) {
      return null;
    }

    const fromUrl = extractRemoteNameFromUrl(url);
    const name = fromUrl || uniqueId.split('_').pop() || uniqueId;

    return {
      name,
      platform: extractPlatformFromUrl(url),
      version: getRemoteVersion(name),
      size: 0,
      url,
    };
  }

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
  static async getCacheStats(): Promise<BundleCacheStats> {
    try {
      const scriptManagerRaw = await AsyncStorage.getItem(
        this.SCRIPT_MANAGER_CACHE_KEY
      );

      if (scriptManagerRaw) {
        const cache = JSON.parse(scriptManagerRaw) as Record<
          string,
          { url?: string }
        >;
        const bundles = Object.entries(cache)
          .map(([uniqueId, entry]) =>
            this.parseScriptManagerCacheEntry(uniqueId, entry)
          )
          .filter((entry): entry is NonNullable<typeof entry> => entry != null);

        return {
          totalBundles: bundles.length,
          totalSize: 0,
          cacheDisabled: __DEV__,
          bundles,
        };
      }

      // Legacy AsyncStorage content keys (unused by Re.Pack ScriptManager).
      const allKeys = await AsyncStorage.getAllKeys();
      const versionKeys = allKeys.filter(key =>
        key.startsWith(this.VERSION_PREFIX)
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
        cacheDisabled: __DEV__,
        bundles,
      };
    } catch (error) {
      console.error('BundleCache: Error getting cache stats:', error);
      return {
        totalBundles: 0,
        totalSize: 0,
        cacheDisabled: __DEV__,
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

/**
 * Keeps cache stats in sync with ScriptManager writes and navigation focus.
 */
export function useLiveCacheStats(enabled = true) {
  const [cacheStats, setCacheStats] = useState<BundleCacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setCacheStats(await BundleCacheManager.getCacheStats());
    } catch (error) {
      console.error('Error loading cache data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    refresh();
    return BundleCacheManager.subscribeToScriptCacheChanges(refresh);
  }, [enabled, refresh]);

  return { cacheStats, loading, refresh };
}
