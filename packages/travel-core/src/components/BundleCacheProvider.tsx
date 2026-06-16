import React, { useEffect } from 'react';
import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  extractPlatformFromUrl,
  extractRemoteNameFromUrl,
  extractVersionFromUrl,
  generateVersionedCacheKey,
  getRemoteVersion,
  isVersionCompatible,
} from '../utils/bundleVersioning';
import { setupTravelScriptResolver } from '../utils/scriptManagerResolver';
import { mfTrace } from '../utils/mfTrace';
import {
  isScriptManagerCacheKey,
  notifyBundleCacheChanged,
} from '../utils/bundleCacheManager';

interface BundleCacheProviderProps {
  children: React.ReactNode;
}

/**
 * Version-aware storage wrapper for ScriptManager
 * Handles bundle versioning and cache invalidation
 */
class VersionedBundleStorage {
  private static readonly VERSION_PREFIX = 'bundle_version_';
  private static readonly CONTENT_PREFIX = 'bundle_content_';

  async getItem(key: string): Promise<string | null> {
    try {
      const version = this.resolveVersion(key);

      if (version) {
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );

        const cachedContent = await AsyncStorage.getItem(
          `${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`
        );
        const cachedVersion = await AsyncStorage.getItem(
          `${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`
        );

        if (
          cachedContent &&
          cachedVersion &&
          isVersionCompatible(version, cachedVersion)
        ) {
          mfTrace('6.storage.getItem.hit', {
            key: versionedKey,
            version: cachedVersion,
            sizeKb: Math.round(cachedContent.length / 1024),
            source: 'AsyncStorage',
          });
          return cachedContent;
        }
        if (cachedContent && cachedVersion) {
          mfTrace('6.storage.getItem.versionMismatch', {
            key: versionedKey,
            expected: version,
            cached: cachedVersion,
          });
          await this.removeItem(key);
        } else {
          mfTrace('6.storage.getItem.miss', {
            key: versionedKey,
            scriptKey: key.slice(0, 120),
            willFetch: true,
          });
        }
      }

      const fallback = await AsyncStorage.getItem(key);
      if (fallback) {
        mfTrace('6.storage.getItem.hit', { key: key.slice(0, 120), source: 'raw' });
      }
      return fallback;
    } catch (error) {
      console.warn('BundleCache: Error reading cache:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const version = this.resolveVersion(key);

      if (version) {
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );

        await Promise.all([
          AsyncStorage.setItem(
            `${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`,
            value
          ),
          AsyncStorage.setItem(
            `${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`,
            version
          ),
        ]);

        mfTrace('6.storage.setItem.saved', {
          key: versionedKey,
          version,
          sizeKb: Math.round(value.length / 1024),
          destination: 'AsyncStorage',
        });
      } else {
        await AsyncStorage.setItem(key, value);
        mfTrace('6.storage.setItem.saved', {
          key: key.slice(0, 120),
          sizeKb: Math.round(value.length / 1024),
          destination: 'AsyncStorage-raw',
        });
      }

      if (isScriptManagerCacheKey(key)) {
        notifyBundleCacheChanged();
      }
    } catch (error) {
      console.warn('BundleCache: Error writing cache:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const version = this.resolveVersion(key);

      if (version) {
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );

        await Promise.all([
          AsyncStorage.removeItem(
            `${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`
          ),
          AsyncStorage.removeItem(
            `${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`
          ),
        ]);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('BundleCache: Error removing cache:', error);
    }
  }

  private extractRemoteName(key: string): string {
    return extractRemoteNameFromUrl(key) || 'unknown';
  }

  private extractPlatform(key: string): string {
    return extractPlatformFromUrl(key);
  }

  private resolveVersion(key: string): string | null {
    const fromUrl = extractVersionFromUrl(key);
    if (fromUrl) {
      return fromUrl;
    }

    const remoteName = this.extractRemoteName(key);
    if (remoteName !== 'unknown') {
      return getRemoteVersion(remoteName);
    }

    return null;
  }
}

/**
 * BundleCacheProvider - Enables version-aware caching for Module Federation bundles
 *
 * Features:
 * - Version-aware bundle caching with semantic versioning
 * - Automatic cache invalidation when versions change (via checkForUpdates)
 * - Fallback handling for version mismatches
 */
const BundleCacheProvider: React.FC<BundleCacheProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    setupTravelScriptResolver();
    const versionedStorage = new VersionedBundleStorage();

    ScriptManager.shared.setStorage({
      getItem: (key: string) => versionedStorage.getItem(key),
      setItem: (key: string, value: string) =>
        versionedStorage.setItem(key, value),
      removeItem: (key: string) => versionedStorage.removeItem(key),
    });

    console.log(
      'BundleCache: Initialized ScriptManager with versioned storage'
    );
    mfTrace('5.storage.initialized', {
      cacheEnabled: !__DEV__,
      message: 'ScriptManager storage adapter mounted',
    });
  }, []);

  return <>{children}</>;
};

export { BundleCacheProvider };
