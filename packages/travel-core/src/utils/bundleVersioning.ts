/**
 * Bundle Versioning Utilities for Module Federation
 */

import { Platform } from 'react-native';
import { REMOTE_NAMES, REMOTES_CATALOG } from '../constants/remotesCatalog';
import {
  getHostIp,
  getRemoteProfile,
  getStaticBaseUrl,
  loadRemoteRegistry,
} from './remoteRegistry';

export interface BundleVersion {
  name: string;
  version: string;
  url: string;
  platform: string;
}

export interface VersionedRemoteConfig {
  [remoteName: string]: {
    version: string;
    name: string;
    url: string;
    manifestUrl?: string;
  };
}

let activeRemoteConfig: VersionedRemoteConfig | null = null;

function resolveRemoteBaseUrl(remoteName: string, profile = getRemoteProfile()) {
  if (profile === 'static' || profile === 'external') {
    return `${getStaticBaseUrl()}/${REMOTES_CATALOG[remoteName].slug}`;
  }

  return `http://${getHostIp()}:${REMOTES_CATALOG[remoteName].devPort}`;
}

export function buildRemoteConfig(
  platform: string = Platform.OS
): VersionedRemoteConfig {
  const profile = getRemoteProfile();

  return REMOTE_NAMES.reduce((acc, remoteName) => {
    const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
    acc[remoteName] = {
      version: REMOTES_CATALOG[remoteName].version,
      name: remoteName,
      url: baseUrl,
      manifestUrl: `${baseUrl}/${platform}/mf-manifest.json`,
    };
    return acc;
  }, {} as VersionedRemoteConfig);
}

export function setActiveRemoteConfig(config: VersionedRemoteConfig) {
  activeRemoteConfig = config;
}

export function getActiveRemoteConfig(): VersionedRemoteConfig {
  return activeRemoteConfig || buildRemoteConfig();
}

/** @deprecated Use getActiveRemoteConfig() — avoids stale profile at module load. */
export function getDefaultRemoteConfig(): VersionedRemoteConfig {
  return buildRemoteConfig();
}

export function getRemoteVersion(remoteName: string): string {
  const config = getActiveRemoteConfig();
  return config[remoteName]?.version || '1.0.0';
}

export function generateVersionedCacheKey(
  remoteName: string,
  platform: string,
  version: string
): string {
  return `bundle_${remoteName}_${platform}_${version}`;
}

export function isVersionCompatible(
  currentVersion: string,
  cachedVersion: string
): boolean {
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  const [cachedMajor, cachedMinor] = cachedVersion.split('.').map(Number);

  return currentMajor === cachedMajor && currentMinor >= cachedMinor;
}

export async function loadRemoteConfig(): Promise<VersionedRemoteConfig> {
  try {
    const registry = await loadRemoteRegistry();
    const config = registry.remotes.reduce((acc, remote) => {
      const manifestUrl = remote.entry;
      const baseUrl = manifestUrl.replace(/\/[^/]+\/mf-manifest\.json$/, '');
      acc[remote.name] = {
        version: remote.version,
        name: remote.name,
        url: baseUrl,
        manifestUrl,
      };
      return acc;
    }, {} as VersionedRemoteConfig);

    setActiveRemoteConfig(config);
    return config;
  } catch (error) {
    console.warn('Failed to load remote config, using defaults:', error);
    const fallback = buildRemoteConfig();
    setActiveRemoteConfig(fallback);
    return fallback;
  }
}

export function extractRemoteNameFromUrl(url: string): string | null {
  const containerMatch = url.match(/\/([^/]+)\.container\.js\.bundle/);
  if (containerMatch) {
    return containerMatch[1];
  }

  const manifestMatch = url.match(/\/([^/]+)\/mf-manifest\.json/);
  if (manifestMatch && manifestMatch[1] !== 'ios' && manifestMatch[1] !== 'android') {
    return null;
  }

  return null;
}

export function extractPlatformFromUrl(url: string): string {
  const match = url.match(/\/(ios|android)\//);
  return match ? match[1] : Platform.OS;
}

export function extractVersionFromUrl(url: string): string | null {
  const queryMatch = url.match(/[?&]v=([^&]+)/);
  if (queryMatch) {
    return queryMatch[1];
  }

  const remoteName = extractRemoteNameFromUrl(url);
  if (remoteName) {
    return getRemoteVersion(remoteName);
  }

  return null;
}

export function getManifestUrl(remoteName: string, platform: string = Platform.OS) {
  const config = getActiveRemoteConfig()[remoteName];
  if (config?.manifestUrl) {
    return config.manifestUrl;
  }

  return `${config?.url || resolveRemoteBaseUrl(remoteName)}/${platform}/mf-manifest.json`;
}

export function getContainerUrl(remoteName: string, platform: string = Platform.OS) {
  const config = getActiveRemoteConfig()[remoteName];
  const baseUrl = config?.url || resolveRemoteBaseUrl(remoteName);
  return `${baseUrl}/${platform}/${remoteName}.container.js.bundle`;
}
