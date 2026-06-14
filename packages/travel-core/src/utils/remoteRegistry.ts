import { Platform } from 'react-native';
import { REMOTE_NAMES, REMOTES_CATALOG } from '../constants/remotesCatalog';
import { DEV_MF_HOST, LOCAL_STATIC_BASE_URL } from '../constants/remoteDefaults';
import { getRemoteRegistryUrl } from './appConfig';
import { mfTrace } from './mfTrace';

export type RemoteProfile = 'dev' | 'prod';

export interface RemoteRegistryEntry {
  name: string;
  entry: string;
  version: string;
  enabled: boolean;
  exposes?: string[];
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

export const FEATURE_METADATA: Record<
  string,
  Pick<RemoteRegistryEntry, 'title' | 'description' | 'icon' | 'color' | 'screen'>
> = {
  TravelWeather: {
    title: 'Weather',
    description: 'Check weather for your destinations',
    screen: 'Weather',
    color: '#4CAF50',
    icon: '☁️',
  },
  TravelDestinations: {
    title: 'Destinations',
    description: 'Explore amazing destinations worldwide',
    screen: 'Destinations',
    color: '#FF9800',
    icon: '🌍',
  },
  TravelSearch: {
    title: 'Search',
    description: 'Find flights and hotels',
    screen: 'Search',
    color: '#9C27B0',
    icon: '✈️',
  },
  TravelPhotos: {
    title: 'Photos',
    description: 'Beautiful travel photography',
    screen: 'Photos',
    color: '#E91E63',
    icon: '📸',
  },
};

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

function buildDevRegistry(platform: string): RemoteRegistry {
  const host = getHostIp();

  return {
    hostMinVersion: '1.0.0',
    profile: 'dev',
    remotes: REMOTE_NAMES.map(name => ({
      name,
      entry: `http://${host}:${REMOTES_CATALOG[name].devPort}/${platform}/mf-manifest.json`,
      version: REMOTES_CATALOG[name].version,
      enabled: true,
      ...FEATURE_METADATA[name],
      startCommand: `pnpm start:travel-${REMOTES_CATALOG[name].slug}`,
    })),
  };
}

/** Local CDN fallback when prod registry fetch fails (e.g. serve:remotes on :4100). */
function buildProdFallbackRegistry(platform: string): RemoteRegistry {
  const baseUrl = getStaticBaseUrl();

  return {
    hostMinVersion: '1.0.0',
    profile: 'prod',
    remotes: REMOTE_NAMES.map(name => ({
      name,
      entry: `${baseUrl}/${REMOTES_CATALOG[name].slug}/${platform}/mf-manifest.json`,
      version: REMOTES_CATALOG[name].version,
      enabled: true,
      ...FEATURE_METADATA[name],
      startCommand: `pnpm serve:remotes`,
    })),
  };
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
      const resolved = {
        ...registry,
        profile: 'prod' as const,
        remotes: registry.remotes.map(remote => ({
          ...FEATURE_METADATA[remote.name],
          ...remote,
          entry: resolveTemplate(remote.entry, platform),
        })),
      };
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
      return buildProdFallbackRegistry(platform);
    }
  }

  mfTrace('1.registry.dev.inMemory', { platform });

  return buildDevRegistry(platform);
}

export function getEnabledFeatures(registry: RemoteRegistry) {
  return registry.remotes
    .filter(remote => remote.enabled)
    .map(remote => ({
      ...FEATURE_METADATA[remote.name],
      ...remote,
    }));
}
