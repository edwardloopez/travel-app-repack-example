import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  MANIFEST_CACHE_PREFIX,
} from 'travel-sdk/lib/manifestCacheKeys.js';
import {
  getActiveRemoteConfig,
  getContainerUrl,
  getRemoteVersion,
  type VersionedRemoteConfig,
} from './bundleVersioning';
import { mfTrace } from './mfTrace';
import { clearCachedManifest, hasCachedManifest } from './manifestCache';
import { retryWithBackoff } from './retryWithBackoff';
import {
  findScriptIdsForRemote,
  readScriptManagerCache,
} from './scriptManagerCacheAccess';

/**
 * Bundle cache orchestration for Module Federation.
 *
 * Offline-ready contract:
 *   hasCachedManifest(name, platform, registryVersion)
 *   AND ScriptManager has entries for that remote
 *   AND bundle_installed_{name}_{platform} === registryVersion
 */

type CacheChangeListener = () => void;
const cacheChangeListeners = new Set<CacheChangeListener>();

export function isScriptManagerCacheKey(key: string): boolean {
  return key.startsWith('Repack.ScriptManager.Cache');
}

/** Called when ScriptManager persists cache metadata to storage. */
export function notifyBundleCacheChanged(): void {
  cacheChangeListeners.forEach(listener => listener());
}

/** Subscribe to ScriptManager cache changes (loads, prefetch, invalidation). */
export function subscribeToScriptCacheChanges(onChange: () => void): () => void {
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

  const manager = ScriptManager.shared as typeof ScriptManager.shared & {
    on(event: 'loaded' | 'invalidated', handler: () => void): void;
    off(event: 'loaded' | 'invalidated', handler: () => void): void;
  };
  const events = ['loaded', 'invalidated'] as const;
  events.forEach(event => manager.on(event, debounced));

  return () => {
    cacheChangeListeners.delete(debounced);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    events.forEach(event => manager.off(event, debounced));
  };
}

export class BundleCacheManager {
  private static readonly INSTALLED_VERSION_PREFIX = 'bundle_installed_';

  private static installedVersionKey(
    remoteName: string,
    platform: string
  ): string {
    return `${this.INSTALLED_VERSION_PREFIX}${remoteName}_${platform}`;
  }

  static async getInstalledVersion(
    remoteName: string,
    platform: string
  ): Promise<string | null> {
    return AsyncStorage.getItem(this.installedVersionKey(remoteName, platform));
  }

  static async setInstalledVersion(
    remoteName: string,
    platform: string,
    version: string
  ): Promise<void> {
    await AsyncStorage.setItem(
      this.installedVersionKey(remoteName, platform),
      version
    );
  }

  private static async clearInstalledVersion(
    remoteName: string,
    platform: string
  ): Promise<void> {
    await AsyncStorage.removeItem(this.installedVersionKey(remoteName, platform));
  }

  private static async clearManifestKeysForRemote(
    remoteName: string,
    platform: string
  ): Promise<void> {
    const prefix = `${MANIFEST_CACHE_PREFIX}${remoteName}_${platform}_`;
    const allKeys = await AsyncStorage.getAllKeys();
    const manifestKeys = allKeys.filter(key => key.startsWith(prefix));

    if (manifestKeys.length > 0) {
      await AsyncStorage.multiRemove(manifestKeys);
    }
  }

  static async invalidateCacheEntries(uniqueIds: string[]): Promise<void> {
    if (uniqueIds.length === 0) {
      return;
    }

    try {
      await ScriptManager.shared.invalidateScripts(uniqueIds);
      mfTrace('3.cache.invalidateEntries', { uniqueIds });
      notifyBundleCacheChanged();
    } catch (error) {
      console.error('BundleCache: Error invalidating cache entries:', error);
    }
  }

  static async invalidateRemote(
    remoteName: string,
    platform: string
  ): Promise<void> {
    try {
      await this.clearInstalledVersion(remoteName, platform);
      await clearCachedManifest(remoteName, platform);
      await this.clearManifestKeysForRemote(remoteName, platform);

      const cache = await readScriptManagerCache();
      const scriptIds = findScriptIdsForRemote(cache, remoteName, platform);
      await this.invalidateCacheEntries(scriptIds);

      if (scriptIds.length > 0) {
        console.log(
          `BundleCache: Invalidated ${scriptIds.length} ScriptManager entries for ${remoteName} (${platform})`
        );
      }
    } catch (error) {
      console.error('BundleCache: Error invalidating cache:', error);
    }
  }

  static async invalidateAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(
        key =>
          key.startsWith(this.INSTALLED_VERSION_PREFIX) ||
          key.startsWith(MANIFEST_CACHE_PREFIX)
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(
          `BundleCache: Cleared ${keysToRemove.length} manifest/installed keys`
        );
      }

      await ScriptManager.shared.invalidateScripts();
      notifyBundleCacheChanged();
    } catch (error) {
      console.error('BundleCache: Error clearing all cache:', error);
    }
  }

  static async hasCachedBundle(
    remoteName: string,
    platform: string = Platform.OS
  ): Promise<boolean> {
    const installedVersion = await this.getInstalledVersion(remoteName, platform);
    if (!installedVersion || installedVersion !== getRemoteVersion(remoteName)) {
      return false;
    }

    const cache = await readScriptManagerCache();
    return findScriptIdsForRemote(cache, remoteName, platform).length > 0;
  }

  static async canLoadOffline(
    remoteName: string,
    platform: string = Platform.OS
  ): Promise<boolean> {
    const [manifest, bundle] = await Promise.all([
      hasCachedManifest(remoteName, platform),
      this.hasCachedBundle(remoteName, platform),
    ]);
    return manifest && bundle;
  }

  static async checkForUpdates(
    remoteConfig: VersionedRemoteConfig = getActiveRemoteConfig()
  ): Promise<string[]> {
    const updatedRemotes: string[] = [];

    try {
      const scriptManagerCache = await readScriptManagerCache();

      for (const [remoteName, config] of Object.entries(remoteConfig)) {
        const platform = Platform.OS;
        const installedVersion = await this.getInstalledVersion(
          remoteName,
          platform
        );
        const hasScriptManagerEntries =
          findScriptIdsForRemote(scriptManagerCache, remoteName, platform)
            .length > 0;

        const needsInvalidation =
          hasScriptManagerEntries && installedVersion !== config.version;

        if (!needsInvalidation) {
          continue;
        }

        await this.invalidateRemote(remoteName, platform);
        updatedRemotes.push(`${remoteName}@${platform}`);
        mfTrace('3.cache.versionMismatch', {
          remoteName,
          platform,
          installedVersion,
          registryVersion: config.version,
        });
        console.log(
          `BundleCache: Detected update for ${remoteName} (${installedVersion} → ${config.version})`
        );
      }
    } catch (error) {
      console.error('BundleCache: Error checking for updates:', error);
    }

    return updatedRemotes;
  }

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
          await this.setInstalledVersion(
            remoteName,
            platform,
            config.version
          );
          notifyBundleCacheChanged();
          mfTrace('4.prefetch.script.ok', {
            remoteName,
            bundleUrl,
            version: config.version,
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
      notifyBundleCacheChanged();
    } catch (error) {
      console.error('BundleCache: Error preloading bundles:', error);
    }
  }
}

export function useBundleCache() {
  return {
    invalidateRemote: (remoteName: string, platform: string) =>
      BundleCacheManager.invalidateRemote(remoteName, platform),
    invalidateCacheEntry: (uniqueId: string) =>
      BundleCacheManager.invalidateCacheEntries([uniqueId]),
    invalidateAll: () => BundleCacheManager.invalidateAll(),
    checkForUpdates: (config?: VersionedRemoteConfig) =>
      BundleCacheManager.checkForUpdates(config),
    preloadBundles: (
      remoteNames: string[],
      platform: string,
      config?: VersionedRemoteConfig
    ) => BundleCacheManager.preloadBundles(remoteNames, platform, config),
  };
}
