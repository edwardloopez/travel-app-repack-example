import { Platform } from 'react-native';
import { getManifestUrl } from './bundleVersioning';
import {
  hasCachedManifestUrl,
  setCachedManifest,
} from './manifestCache';
import { mfTrace } from './mfTrace';

const DEFAULT_PROBE_TIMEOUT_MS = 3000;
const UNREACHABLE_PROBE_TTL_MS = 30_000;

/** Only cache failed probes — success is not cached (CDN may go down anytime). */
const unreachableProbeCache = new Map<string, number>();

/**
 * Lightweight network probe. Uses fetch (same stack as MF manifest loads).
 * Returns false on timeout, DNS failure, or non-2xx — without invoking ScriptManager.
 */
export async function probeUrlReachable(
  url: string,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS
): Promise<boolean> {
  const unreachableUntil = unreachableProbeCache.get(url);
  if (unreachableUntil != null && unreachableUntil > Date.now()) {
    mfTrace('1.manifest.probe.cached', { url, reachable: false });
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    if (response.ok) {
      if (url.includes('mf-manifest.json')) {
        const body = await response.text();
        await setCachedManifest(url, body);
      }
      unreachableProbeCache.delete(url);
      return true;
    }
    unreachableProbeCache.set(url, Date.now() + UNREACHABLE_PROBE_TTL_MS);
    return false;
  } catch {
    unreachableProbeCache.set(url, Date.now() + UNREACHABLE_PROBE_TTL_MS);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearManifestProbeCache(): void {
  unreachableProbeCache.clear();
}

export async function isRemoteManifestReachable(
  remoteName: string,
  platform: string = Platform.OS
): Promise<boolean> {
  const manifestUrl = getManifestUrl(remoteName, platform);
  if (await hasCachedManifestUrl(manifestUrl)) {
    mfTrace('1.manifest.probe', {
      remoteName,
      manifestUrl,
      reachable: true,
      source: 'cache',
    });
    return true;
  }

  const reachable = await probeUrlReachable(manifestUrl);
  mfTrace('1.manifest.probe', { remoteName, manifestUrl, reachable });
  return reachable;
}
