import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getManifestUrl, getRemoteVersion } from './bundleVersioning';
import { resolveRemoteFromManifestUrl } from './remoteRegistry';
import { mfTrace } from './mfTrace';

const MANIFEST_CACHE_PREFIX = 'mf_manifest_';

function versionedCacheKey(
  remoteName: string,
  platform: string,
  version: string
): string {
  return `${MANIFEST_CACHE_PREFIX}${remoteName}_${platform}_${version}`;
}

/** URL key — shared with mf-fetch-plugin (MF runtime bundle, no travel-core import). */
function legacyCacheKey(manifestUrl: string): string {
  return `${MANIFEST_CACHE_PREFIX}${manifestUrl}`;
}

export async function getCachedManifest(manifestUrl: string): Promise<string | null> {
  const resolved = resolveRemoteFromManifestUrl(manifestUrl);
  if (resolved) {
    const version = getRemoteVersion(resolved.remoteName);
    const versioned = await AsyncStorage.getItem(
      versionedCacheKey(resolved.remoteName, resolved.platform, version)
    );
    if (versioned) {
      return versioned;
    }
  }

  return AsyncStorage.getItem(legacyCacheKey(manifestUrl));
}

export async function setCachedManifest(
  manifestUrl: string,
  body: string
): Promise<void> {
  const resolved = resolveRemoteFromManifestUrl(manifestUrl);
  if (resolved) {
    const version = getRemoteVersion(resolved.remoteName);
    await AsyncStorage.setItem(
      versionedCacheKey(resolved.remoteName, resolved.platform, version),
      body
    );
  }
  await AsyncStorage.setItem(legacyCacheKey(manifestUrl), body);

  mfTrace('1.manifest.cache.saved', {
    url: manifestUrl,
    remoteName: resolved?.remoteName,
    version: resolved ? getRemoteVersion(resolved.remoteName) : undefined,
    sizeKb: Math.round(body.length / 1024),
  });
}

export async function hasCachedManifest(
  remoteName: string,
  platform: string = Platform.OS
): Promise<boolean> {
  const version = getRemoteVersion(remoteName);
  const versioned = await AsyncStorage.getItem(
    versionedCacheKey(remoteName, platform, version)
  );
  if (versioned != null && versioned.length > 0) {
    return true;
  }

  const url = getManifestUrl(remoteName, platform);
  const legacy = await AsyncStorage.getItem(legacyCacheKey(url));
  return legacy != null && legacy.length > 0;
}

export async function hasCachedManifestUrl(manifestUrl: string): Promise<boolean> {
  const cached = await getCachedManifest(manifestUrl);
  return cached != null && cached.length > 0;
}

export async function clearCachedManifest(
  remoteName: string,
  platform: string = Platform.OS
): Promise<void> {
  const version = getRemoteVersion(remoteName);
  const url = getManifestUrl(remoteName, platform);
  await AsyncStorage.multiRemove([
    versionedCacheKey(remoteName, platform, version),
    legacyCacheKey(url),
  ]);
  mfTrace('1.manifest.cache.cleared', { remoteName, url, version });
}
