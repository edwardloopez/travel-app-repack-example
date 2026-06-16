import { Platform } from 'react-native';
import devRegistryJson from 'travel-sdk/lib/remote-registry.dev.json';
import prodRegistryJson from 'travel-sdk/lib/remote-registry.prod.json';
import { DEV_MF_HOST, LOCAL_STATIC_BASE_URL } from '../constants/remoteDefaults';
import { getRemoteRegistryUrl } from './appConfig';
import { mfTrace } from './mfTrace';

export type RemoteProfile = 'dev' | 'prod';

export interface RemoteRegistryEntry {
  name: string;
  slug: string;
  devPort?: number;
  entry: string;
  version: string;
  enabled: boolean;
  exposes: string[];
  screen?: string;
  startCommand?: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface RemoteRegistry {
  hostMinVersion: string;
  profile?: RemoteProfile;
  remotes: RemoteRegistryEntry[];
}

let activeRegistry: RemoteRegistry | null = null;

export function setActiveRegistry(registry: RemoteRegistry) {
  activeRegistry = registry;
}

export function getActiveRegistry(): RemoteRegistry | null {
  return activeRegistry;
}

/** Dev vs prod is derived from the build — no REMOTE_PROFILE env var. */
export function getRemoteProfile(): RemoteProfile {
  return __DEV__ ? 'dev' : 'prod';
}

export function getHostIp(): string {
  return DEV_MF_HOST;
}

export function getStaticBaseUrl(): string {
  return LOCAL_STATIC_BASE_URL;
}

export function getRegistryUrl(): string {
  return getRemoteRegistryUrl();
}

export function resolveTemplate(
  template: string,
  platform: string = Platform.OS
): string {
  return template
    .replace(/\$\{platform\}/g, platform)
    .replace(/\$\{host\}/g, getHostIp());
}

function normalizeRegistry(
  registry: RemoteRegistry,
  platform: string
): RemoteRegistry {
  return {
    ...registry,
    remotes: registry.remotes.map(remote => ({
      ...remote,
      entry: resolveTemplate(remote.entry, platform),
    })),
  };
}

function loadDevRegistryFromBundle(platform: string): RemoteRegistry {
  return normalizeRegistry(
    { ...(devRegistryJson as RemoteRegistry), profile: 'dev' },
    platform
  );
}

function loadProdFallbackRegistry(platform: string): RemoteRegistry {
  return normalizeRegistry(
    { ...(prodRegistryJson as RemoteRegistry), profile: 'prod' },
    platform
  );
}

export function findRemoteByUrl(
  url: string,
  registry: RemoteRegistry | null = getActiveRegistry()
): RemoteRegistryEntry | null {
  if (!registry) {
    return null;
  }

  for (const remote of registry.remotes) {
    if (url.includes(`/${remote.name}.container.js.bundle`)) {
      return remote;
    }

    if (
      remote.slug &&
      (url.includes(`/${remote.slug}/ios/`) ||
        url.includes(`/${remote.slug}/android/`))
    ) {
      return remote;
    }

    if (remote.devPort && url.includes(`:${remote.devPort}/`)) {
      return remote;
    }

    const entryBase = remote.entry.replace(/\/mf-manifest\.json$/, '');
    if (url.includes(entryBase)) {
      return remote;
    }
  }

  return null;
}

export function resolveRemoteFromManifestUrl(
  url: string
): { remoteName: string; platform: string } | null {
  const platformMatch = url.match(/\/(ios|android)\/mf-manifest\.json/);
  if (!platformMatch) {
    return null;
  }

  const remote = findRemoteByUrl(url);
  if (!remote) {
    return null;
  }

  return { remoteName: remote.name, platform: platformMatch[1] };
}

export async function loadRemoteRegistry(
  platform: string = Platform.OS
): Promise<RemoteRegistry> {
  const profile = getRemoteProfile();

  if (profile === 'prod') {
    const registryUrl = getRegistryUrl();
    mfTrace('1.registry.fetch.start', { url: registryUrl, platform });
    const startedAt = Date.now();
    try {
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }
      const registry = (await response.json()) as RemoteRegistry;
      const resolved = normalizeRegistry(
        { ...registry, profile: 'prod' },
        platform
      );
      mfTrace('1.registry.fetch.ok', {
        durationMs: Date.now() - startedAt,
        remotes: resolved.remotes.map(r => ({
          name: r.name,
          entry: r.entry,
          version: r.version,
          enabled: r.enabled,
        })),
      });
      return resolved;
    } catch (error) {
      mfTrace('1.registry.fetch.fallback', {
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      console.warn('Failed to load prod registry, using local fallback:', error);
      return loadProdFallbackRegistry(platform);
    }
  }

  const resolved = loadDevRegistryFromBundle(platform);
  mfTrace('1.registry.dev.bundled', {
    platform,
    remotes: resolved.remotes.map(r => ({
      name: r.name,
      entry: r.entry,
      version: r.version,
    })),
  });
  return resolved;
}

export function getEnabledFeatures(registry: RemoteRegistry) {
  return registry.remotes.filter(remote => remote.enabled);
}
