import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  legacyManifestKey,
  versionedManifestKey,
} from 'travel-sdk/lib/manifestCacheKeys.js';
import { getManifestUrl, getRemoteVersion } from './bundleVersioning';
import { resolveRemoteFromManifestUrlWithSnapshot } from './registrySnapshot';
import { mfTrace } from './mfTrace';

export async function getCachedManifest(manifestUrl: string): Promise<string | null> {
  const resolved = await resolveRemoteFromManifestUrlWithSnapshot(manifestUrl);
  if (resolved) {
    const versioned = await AsyncStorage.getItem(
      versionedManifestKey(
        resolved.remoteName,
        resolved.platform,
        resolved.version
      )
    );
    if (versioned) {
      return versioned;
    }
  }

  return AsyncStorage.getItem(legacyManifestKey(manifestUrl));
}

export async function setCachedManifest(
  manifestUrl: string,
  body: string
): Promise<void> {
  const resolved = await resolveRemoteFromManifestUrlWithSnapshot(manifestUrl);
  if (resolved) {
    await AsyncStorage.setItem(
      versionedManifestKey(
        resolved.remoteName,
        resolved.platform,
        resolved.version
      ),
      body
    );
  }

  mfTrace('1.manifest.cache.saved', {
    url: manifestUrl,
    remoteName: resolved?.remoteName,
    version: resolved?.version,
    sizeKb: Math.round(body.length / 1024),
  });
}

export async function hasCachedManifest(
  remoteName: string,
  platform: string = Platform.OS
): Promise<boolean> {
  const version = getRemoteVersion(remoteName);
  const versioned = await AsyncStorage.getItem(
    versionedManifestKey(remoteName, platform, version)
  );
  if (versioned != null && versioned.length > 0) {
    return true;
  }

  const url = getManifestUrl(remoteName, platform);
  const legacy = await AsyncStorage.getItem(legacyManifestKey(url));
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
    versionedManifestKey(remoteName, platform, version),
    legacyManifestKey(url),
  ]);
  mfTrace('1.manifest.cache.cleared', { remoteName, url, version });
}
