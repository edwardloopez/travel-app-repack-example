import {
  DEV_MF_HOST,
  LOCAL_REGISTRY_URL,
  LOCAL_STATIC_BASE_URL,
} from './remoteDefaults.ts';
import { REMOTE_NAMES, REMOTES_CATALOG } from './remotesCatalog.ts';

export type RemoteProfile = 'dev' | 'prod';

export interface RemoteConfigEntry {
  version: string;
  name: string;
  url: string;
  slug: string;
  port: number;
}

export interface RegistryRemoteEntry {
  name: string;
  entry: string;
  version: string;
  enabled: boolean;
  exposes: string[];
  screen: string;
  startCommand: string;
}

export interface RegistryJson {
  hostMinVersion: string;
  profile: RemoteProfile;
  remotes: RegistryRemoteEntry[];
}

function getHostIp(): string {
  return DEV_MF_HOST;
}

function getProfile(): RemoteProfile {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

function getStaticBaseUrl(): string {
  return LOCAL_STATIC_BASE_URL;
}

function getRegistryUrl(): string {
  return LOCAL_REGISTRY_URL;
}

function resolveRemoteBaseUrl(
  remoteName: string,
  profile: RemoteProfile = getProfile()
): string {
  const entry = REMOTES_CATALOG[remoteName];
  if (profile === 'prod') {
    return `${getStaticBaseUrl()}/${entry.slug}`;
  }

  return `http://${getHostIp()}:${entry.devPort}`;
}

function getManifestEntry(
  remoteName: string,
  platform: string,
  profile: RemoteProfile = getProfile()
): string {
  const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
  return `${remoteName}@${baseUrl}/${platform}/mf-manifest.json`;
}

function getRemoteConfigs(
  profile: RemoteProfile = getProfile()
): Record<string, RemoteConfigEntry> {
  return REMOTE_NAMES.reduce<Record<string, RemoteConfigEntry>>(
    (acc, remoteName) => {
      const entry = REMOTES_CATALOG[remoteName];
      acc[remoteName] = {
        version: entry.version,
        name: remoteName,
        url: resolveRemoteBaseUrl(remoteName, profile),
        slug: entry.slug,
        port: entry.devPort,
      };
      return acc;
    },
    {}
  );
}

function buildHostRemotes(
  profile: RemoteProfile | undefined = getProfile(),
  platform = 'ios'
): Record<string, string> {
  return REMOTE_NAMES.reduce<Record<string, string>>((acc, remoteName) => {
    const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
    acc[remoteName] = `${remoteName}@${baseUrl}/${platform}/mf-manifest.json`;
    return acc;
  }, {});
}

const REMOTE_EXPOSES: Partial<Record<string, string>> = {
  TravelWeather: './App',
  TravelSearch: './App',
};

function getRemoteExpose(remoteName: string): string {
  if (REMOTE_EXPOSES[remoteName]) {
    return REMOTE_EXPOSES[remoteName]!;
  }

  return `./${remoteName.replace('Travel', '')}Screen`;
}

function buildRegistryJson(profile: RemoteProfile = getProfile()): RegistryJson {
  const baseUrl = getStaticBaseUrl();

  return {
    hostMinVersion: '1.0.0',
    profile,
    remotes: REMOTE_NAMES.map(remoteName => {
      const entry = REMOTES_CATALOG[remoteName];
      return {
        name: remoteName,
        entry: `${baseUrl}/${entry.slug}/\${platform}/mf-manifest.json`,
        version: entry.version,
        enabled: true,
        exposes: [getRemoteExpose(remoteName)],
        screen: remoteName.replace('Travel', ''),
        startCommand: `pnpm start:travel-${entry.slug}`,
      };
    }),
  };
}

export {
  getHostIp,
  getProfile,
  getStaticBaseUrl,
  getRegistryUrl,
  resolveRemoteBaseUrl,
  getManifestEntry,
  getRemoteConfigs,
  buildHostRemotes,
  buildRegistryJson,
};
