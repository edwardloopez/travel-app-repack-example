import { Platform } from 'react-native';
import {
  DEV_PORTS,
  REMOTE_NAMES,
  REMOTE_SLUGS,
  REMOTE_VERSIONS,
} from '../constants/remotesCatalog';
import { LOCAL_STATIC_BASE_URL } from '../constants/remoteDefaults';
import { getConfigValue, getRemoteRegistryUrl } from './appConfig';

export type RemoteProfile = 'dev' | 'static' | 'external';

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

export function getRemoteProfile(): RemoteProfile {
  const profile = getConfigValue('REMOTE_PROFILE') || 'dev';
  if (profile === 'static' || profile === 'external') {
    return profile;
  }
  return 'dev';
}

export function getHostIp(): string {
  return getConfigValue('HOST_IP_ADDRESS') || 'localhost';
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
      entry: `http://${host}:${DEV_PORTS[name]}/${platform}/mf-manifest.json`,
      version: REMOTE_VERSIONS[name],
      enabled: true,
      ...FEATURE_METADATA[name],
      startCommand: `pnpm start:travel-${REMOTE_SLUGS[name]}`,
    })),
  };
}

function buildStaticRegistry(platform: string): RemoteRegistry {
  const baseUrl = getStaticBaseUrl();

  return {
    hostMinVersion: '1.0.0',
    profile: 'static',
    remotes: REMOTE_NAMES.map(name => ({
      name,
      entry: `${baseUrl}/${REMOTE_SLUGS[name]}/${platform}/mf-manifest.json`,
      version: REMOTE_VERSIONS[name],
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

  if (profile === 'external') {
    try {
      const response = await fetch(getRegistryUrl());
      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }
      const registry = (await response.json()) as RemoteRegistry;
      return {
        ...registry,
        remotes: registry.remotes.map(remote => ({
          ...FEATURE_METADATA[remote.name],
          ...remote,
          entry: resolveTemplate(remote.entry, platform),
        })),
      };
    } catch (error) {
      console.warn('Failed to load external registry, using static fallback:', error);
      return buildStaticRegistry(platform);
    }
  }

  if (profile === 'static') {
    return buildStaticRegistry(platform);
  }

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
