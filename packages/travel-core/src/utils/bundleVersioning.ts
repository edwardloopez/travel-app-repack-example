/**
 * Bundle Versioning Utilities for Module Federation
 */

import { Platform } from 'react-native';
import {
  findRemoteByUrl,
  getActiveRegistry,
  resolveTemplate,
  setActiveRegistry,
  type RemoteRegistry,
} from './remoteRegistry';
import { mfTrace } from './mfTrace';
import { persistRegistrySnapshot } from './registrySnapshot';

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

export function setActiveRemoteConfig(config: VersionedRemoteConfig) {
  activeRemoteConfig = config;
}

export function getActiveRemoteConfig(): VersionedRemoteConfig {
  return activeRemoteConfig ?? {};
}

export function getRemoteVersion(remoteName: string): string {
  const config = getActiveRemoteConfig();
  return config[remoteName]?.version || '1.0.0';
}

export function remoteConfigFromRegistry(
  registry: RemoteRegistry
): VersionedRemoteConfig {
  return registry.remotes.reduce((acc, remote) => {
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
}

/**
 * Apply URLs/versions from an already-loaded registry (no fetch).
 * */
export async function applyRemoteConfig(
  registry: RemoteRegistry
): Promise<VersionedRemoteConfig> {
  setActiveRegistry(registry);
  const config = remoteConfigFromRegistry(registry);
  setActiveRemoteConfig(config);
  await persistRegistrySnapshot(registry);
  mfTrace('2.remoteConfig.applied', {
    remotes: Object.values(config).map(c => ({
      name: c.name,
      version: c.version,
      manifestUrl: c.manifestUrl,
      url: c.url,
    })),
  });
  return config;
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

/** Resolve MF remote name from container or chunk URL using the active registry. */
export function resolveRemoteNameFromCacheUrl(url: string): string | null {
  const fromContainer = extractRemoteNameFromUrl(url);
  if (fromContainer) {
    return fromContainer;
  }

  return findRemoteByUrl(url)?.name ?? null;
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

function resolveManifestUrlFromRegistry(
  remoteName: string,
  platform: string
): string | undefined {
  const config = getActiveRemoteConfig()[remoteName];
  if (config?.manifestUrl) {
    return config.manifestUrl;
  }

  const remote = getActiveRegistry()?.remotes.find(entry => entry.name === remoteName);
  if (!remote) {
    return undefined;
  }

  return resolveTemplate(remote.entry, platform);
}

export function getManifestUrl(remoteName: string, platform: string = Platform.OS) {
  return resolveManifestUrlFromRegistry(remoteName, platform) ?? '';
}

export function getContainerUrl(remoteName: string, platform: string = Platform.OS) {
  const config = getActiveRemoteConfig()[remoteName];
  const baseUrl =
    config?.url ??
    resolveManifestUrlFromRegistry(remoteName, platform)?.replace(
      /\/mf-manifest\.json$/,
      ''
    );

  if (!baseUrl) {
    return '';
  }

  return `${baseUrl}/${platform}/${remoteName}.container.js.bundle`;
}
