import React, { useEffect } from 'react';
import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  extractVersionFromUrl, 
  generateVersionedCacheKey, 
  isVersionCompatible 
} from '../utils/bundleVersioning';

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
      // Extract version from the key/URL if available
      const version = extractVersionFromUrl(key);
      
      if (version) {
        // Use versioned cache key
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );
        
        // Check if we have a cached version
        const cachedContent = await AsyncStorage.getItem(`${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`);
        const cachedVersion = await AsyncStorage.getItem(`${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`);
        
        if (cachedContent && cachedVersion && isVersionCompatible(version, cachedVersion)) {
          console.log(`BundleCache: Cache hit for ${versionedKey} (v${cachedVersion})`);
          return cachedContent;
        } else if (cachedContent && cachedVersion) {
          console.log(`BundleCache: Version mismatch for ${versionedKey}. Current: ${version}, Cached: ${cachedVersion}`);
          // Clean up old version
          await this.removeItem(key);
        }
      }
      
      // Fallback to regular key-based storage
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('BundleCache: Error reading cache:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const version = extractVersionFromUrl(key);
      
      if (version) {
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );
        
        await Promise.all([
          AsyncStorage.setItem(`${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`, value),
          AsyncStorage.setItem(`${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`, version)
        ]);
        
        console.log(`BundleCache: Cached ${versionedKey} (v${version})`);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('BundleCache: Error writing cache:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const version = extractVersionFromUrl(key);
      
      if (version) {
        const versionedKey = generateVersionedCacheKey(
          this.extractRemoteName(key),
          this.extractPlatform(key),
          version
        );
        
        await Promise.all([
          AsyncStorage.removeItem(`${VersionedBundleStorage.CONTENT_PREFIX}${versionedKey}`),
          AsyncStorage.removeItem(`${VersionedBundleStorage.VERSION_PREFIX}${versionedKey}`)
        ]);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('BundleCache: Error removing cache:', error);
    }
  }

  private extractRemoteName(key: string): string {
    const match = key.match(/\/([^\/]+)\.container\.js\.bundle/);
    return match ? match[1] : 'unknown';
  }

  private extractPlatform(key: string): string {
    const match = key.match(/\/(ios|android)\//);
    return match ? match[1] : 'unknown';
  }

  /**
   * Clean up old bundle versions
   */
  async cleanupOldVersions(keepLatest: number = 3): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const versionKeys = allKeys.filter(key => key.startsWith(VersionedBundleStorage.VERSION_PREFIX));
      
      const bundles: Record<string, { key: string; version: string }[]> = {};
      
      for (const versionKey of versionKeys) {
        const version = await AsyncStorage.getItem(versionKey);
        if (version) {
          const bundleKey = versionKey.replace(VersionedBundleStorage.VERSION_PREFIX, '');
          const [, remoteName, platform] = bundleKey.split('_');
          const bundleId = `${remoteName}_${platform}`;
          
          if (!bundles[bundleId]) {
            bundles[bundleId] = [];
          }
          
          bundles[bundleId].push({ key: bundleKey, version });
        }
      }
      
      // Clean up old versions for each bundle
      for (const [bundleId, versions] of Object.entries(bundles)) {
        if (versions.length > keepLatest) {
          // Sort by version and keep only the latest N versions
          versions.sort((a, b) => b.version.localeCompare(a.version));
          const toDelete = versions.slice(keepLatest);
          
          for (const { key } of toDelete) {
            await Promise.all([
              AsyncStorage.removeItem(`${VersionedBundleStorage.CONTENT_PREFIX}${key}`),
              AsyncStorage.removeItem(`${VersionedBundleStorage.VERSION_PREFIX}${key}`)
            ]);
          }
          
          console.log(`BundleCache: Cleaned up ${toDelete.length} old versions for ${bundleId}`);
        }
      }
    } catch (error) {
      console.warn('BundleCache: Error during cleanup:', error);
    }
  }
}

/**
 * BundleCacheProvider - Enables version-aware caching for Module Federation bundles
 * 
 * Features:
 * - Version-aware bundle caching with semantic versioning
 * - Automatic cache invalidation when versions change
 * - Cleanup of old bundle versions
 * - Fallback handling for version mismatches
 */
const BundleCacheProvider: React.FC<BundleCacheProviderProps> = ({ children }) => {
  useEffect(() => {
    const versionedStorage = new VersionedBundleStorage();
    
    ScriptManager.shared.setStorage({
      getItem: (key: string) => versionedStorage.getItem(key),
      setItem: (key: string, value: string) => versionedStorage.setItem(key, value),
      removeItem: (key: string) => versionedStorage.removeItem(key),
    });

    console.log('BundleCache: Initialized ScriptManager with versioned storage');
    
    versionedStorage.cleanupOldVersions(3);
    
    // Optional: Add event listeners for debugging cache behavior
    if (__DEV__) {
      ScriptManager.shared.on('loaded', (script) => {
        console.log(`BundleCache: Script loaded - ${script.scriptId}`);
      });

      ScriptManager.shared.on('error', (error) => {
        console.warn('BundleCache: Script loading error:', error);
      });

      ScriptManager.shared.on('resolved', (script) => {
        console.log(`BundleCache: Script resolved - ${script.scriptId} -> ${script.locator?.url}`);
      });
    }
  }, []);

  return <>{children}</>;
};

export { BundleCacheProvider };
