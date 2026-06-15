import {
  DEV_MF_HOST,
  LOCAL_REGISTRY_URL,
  LOCAL_STATIC_BASE_URL,
} from './remoteDefaults.js';
import { REMOTE_NAMES, REMOTES_CATALOG } from './remotesCatalog.js';
import { getRemotePackageVersion } from './remoteVersions.js';

function getHostIp() {
  return DEV_MF_HOST;
}

function getProfile() {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

function getStaticBaseUrl() {
  return LOCAL_STATIC_BASE_URL;
}

function getRegistryUrl() {
  return LOCAL_REGISTRY_URL;
}

function resolveRemoteBaseUrl(remoteName, profile = getProfile()) {
  const entry = REMOTES_CATALOG[remoteName];
  if (profile === 'prod') {
    return `${getStaticBaseUrl()}/${entry.slug}`;
  }

  return `http://${getHostIp()}:${entry.devPort}`;
}

function getManifestEntry(remoteName, platform, profile = getProfile()) {
  const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
  return `${remoteName}@${baseUrl}/${platform}/mf-manifest.json`;
}

function getRemoteConfigs(profile = getProfile()) {
  return REMOTE_NAMES.reduce((acc, remoteName) => {
    const entry = REMOTES_CATALOG[remoteName];
    acc[remoteName] = {
      version: getRemotePackageVersion(remoteName),
      name: remoteName,
      url: resolveRemoteBaseUrl(remoteName, profile),
      slug: entry.slug,
      port: entry.devPort,
    };
    return acc;
  }, {});
}

function buildHostRemotes(profile = getProfile(), platform = 'ios') {
  return REMOTE_NAMES.reduce((acc, remoteName) => {
    const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
    acc[remoteName] = `${remoteName}@${baseUrl}/${platform}/mf-manifest.json`;
    return acc;
  }, {});
}

const REMOTE_EXPOSES = {
  TravelWeather: './App',
  TravelSearch: './App',
};

function getRemoteExpose(remoteName) {
  if (REMOTE_EXPOSES[remoteName]) {
    return REMOTE_EXPOSES[remoteName];
  }

  return `./${remoteName.replace('Travel', '')}Screen`;
}

function buildRegistryJson(profile = getProfile()) {
  const baseUrl = getStaticBaseUrl();

  return {
    hostMinVersion: '1.0.0',
    profile,
    remotes: REMOTE_NAMES.map(remoteName => {
      const entry = REMOTES_CATALOG[remoteName];
      return {
        name: remoteName,
        entry: `${baseUrl}/${entry.slug}/\${platform}/mf-manifest.json`,
        version: getRemotePackageVersion(remoteName),
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
