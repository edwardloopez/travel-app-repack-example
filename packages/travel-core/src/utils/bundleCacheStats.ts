import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { BundleCacheManager } from './bundleCacheManager';
import {
  extractPlatformFromUrl,
  getRemoteVersion,
  resolveRemoteNameFromCacheUrl,
} from './bundleVersioning';
import { readScriptManagerCache } from './scriptManagerCacheAccess';
import { subscribeToScriptCacheChanges } from './bundleCacheManager';

/** Debug / introspection — not required for MF bootstrap or offline loading. */
export type BundleCacheStats = {
  totalBundles: number;
  totalSize: number;
  cacheDisabled: boolean;
  bundles: Array<{
    uniqueId: string;
    name: string;
    kind: 'container' | 'chunk' | 'unknown';
    platform: string;
    version: string;
    size: number;
    url?: string;
  }>;
};

const LEGACY_VERSION_PREFIX = 'bundle_version_';
const LEGACY_CONTENT_PREFIX = 'bundle_content_';

async function parseScriptManagerCacheEntry(
  uniqueId: string,
  entry: { url?: string }
): Promise<BundleCacheStats['bundles'][number] | null> {
  const url = entry.url;
  if (!url) {
    return null;
  }

  const remoteName = resolveRemoteNameFromCacheUrl(url);
  const name = remoteName || uniqueId.split('_').pop() || uniqueId;
  const kind = url.includes('.container.js.bundle')
    ? 'container'
    : url.includes('.chunk.bundle') || url.includes('__federation_expose_')
      ? 'chunk'
      : 'unknown';
  const platform = extractPlatformFromUrl(url);
  const installedVersion =
    remoteName != null
      ? await BundleCacheManager.getInstalledVersion(remoteName, platform)
      : null;

  return {
    uniqueId,
    name,
    kind,
    platform,
    version:
      installedVersion ??
      (remoteName ? getRemoteVersion(remoteName) : 'unknown'),
    size: 0,
    url,
  };
}

export async function getBundleCacheStats(): Promise<BundleCacheStats> {
  try {
    const cache = await readScriptManagerCache();

    if (Object.keys(cache).length > 0) {
      const bundles = (
        await Promise.all(
          Object.entries(cache).map(([uniqueId, entry]) =>
            parseScriptManagerCacheEntry(uniqueId, entry)
          )
        )
      ).filter((entry): entry is NonNullable<typeof entry> => entry != null);

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
      key.startsWith(LEGACY_VERSION_PREFIX)
    );

    const bundles = [];
    let totalSize = 0;

    for (const versionKey of versionKeys) {
      const version = await AsyncStorage.getItem(versionKey);
      const contentKey = versionKey.replace(
        LEGACY_VERSION_PREFIX,
        LEGACY_CONTENT_PREFIX
      );
      const content = await AsyncStorage.getItem(contentKey);

      if (version && content) {
        const bundleKey = versionKey.replace(LEGACY_VERSION_PREFIX, '');
        const [, name, platform] = bundleKey.split('_');
        const size = content.length;

        bundles.push({
          uniqueId: versionKey,
          name,
          kind: 'unknown' as const,
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

/** Keeps cache stats in sync with ScriptManager writes (debug screen). */
export function useLiveCacheStats(enabled = true) {
  const [cacheStats, setCacheStats] = useState<BundleCacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setCacheStats(await getBundleCacheStats());
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
    return subscribeToScriptCacheChanges(refresh);
  }, [enabled, refresh]);

  return { cacheStats, loading, refresh };
}
