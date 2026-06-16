import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  generateVersionedCacheKey,
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
  isScriptManagerCacheKey,
  readScriptManagerCache,
} from './scriptManagerCacheAccess';

/**
 * Bundle cache orchestration for Module Federation (invalidation, prefetch, offline checks).
 */

type CacheChangeListener = () => void;
const cacheChangeListeners = new Set<CacheChangeListener>();

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

export { isScriptManagerCacheKey };

export class BundleCacheManager {
  private static readonly VERSION_PREFIX = 'bundle_version_';
  private static readonly CONTENT_PREFIX = 'bundle_content_';
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
    platform: string,
    version?: string
  ): Promise<void> {
    try {
      if (version) {
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
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToDelete = allKeys.filter(key =>
          key.includes(`${remoteName}_${platform}`)
        );

        if (keysToDelete.length > 0) {
          await AsyncStorage.multiRemove(keysToDelete);
        }
      }

      await this.clearInstalledVersion(remoteName, platform);
      await clearCachedManifest(remoteName, platform);

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
      const bundleKeys = allKeys.filter(
        key =>
          key.startsWith(this.CONTENT_PREFIX) ||
          key.startsWith(this.VERSION_PREFIX) ||
          key.startsWith(this.INSTALLED_VERSION_PREFIX)
      );

      if (bundleKeys.length > 0) {
        await AsyncStorage.multiRemove(bundleKeys);
        console.log(
          `BundleCache: Invalidated ${bundleKeys.length} cached bundles`
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
    } catch (error) {
      console.error('BundleCache: Error preloading bundles:', error);
    }
  }
}

export function useBundleCache() {
  return {
    invalidateRemote: (
      remoteName: string,
      platform: string,
      version?: string
    ) => BundleCacheManager.invalidateRemote(remoteName, platform, version),
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
