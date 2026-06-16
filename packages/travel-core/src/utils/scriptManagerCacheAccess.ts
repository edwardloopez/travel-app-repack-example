import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  extractPlatformFromUrl,
  resolveRemoteNameFromCacheUrl,
} from './bundleVersioning';

/**
 * Re.Pack ScriptManager metadata prefix (full key includes version + debug/release).
 **/
export const SCRIPT_MANAGER_CACHE_PREFIX = 'Repack.ScriptManager.Cache';

export function isScriptManagerCacheKey(key: string): boolean {
  return key.startsWith(SCRIPT_MANAGER_CACHE_PREFIX);
}

/**
 * Resolve the ScriptManager metadata key from AsyncStorage without hardcoding
 * Re.Pack's cache schema version (e.g. v4 → v5).
 */
export async function resolveScriptManagerCacheKey(): Promise<string | null> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(key => isScriptManagerCacheKey(key));
  if (cacheKeys.length === 0) {
    return null;
  }

  const envSuffix = __DEV__ ? 'debug' : 'release';
  return cacheKeys.find(key => key.endsWith(`.${envSuffix}`)) ?? cacheKeys[0];
}

export async function readScriptManagerCache(): Promise<
  Record<string, { url?: string }>
> {
  const cacheKey = await resolveScriptManagerCacheKey();
  if (!cacheKey) {
    return {};
  }

  const scriptManagerRaw = await AsyncStorage.getItem(cacheKey);
  if (!scriptManagerRaw) {
    return {};
  }

  return JSON.parse(scriptManagerRaw) as Record<string, { url?: string }>;
}

export function findScriptIdsForRemote(
  cache: Record<string, { url?: string }>,
  remoteName: string,
  platform: string
): string[] {
  return Object.entries(cache)
    .filter(([, entry]) => {
      if (!entry.url) {
        return false;
      }
      const resolved = resolveRemoteNameFromCacheUrl(entry.url);
      return (
        resolved === remoteName &&
        extractPlatformFromUrl(entry.url) === platform
      );
    })
    .map(([uniqueId]) => uniqueId);
}
