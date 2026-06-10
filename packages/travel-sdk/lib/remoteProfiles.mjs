import {
  LOCAL_REGISTRY_URL,
  LOCAL_STATIC_BASE_URL,
} from './remoteDefaults.mjs';
import { REMOTE_NAMES, REMOTES_CATALOG } from './remotesCatalog.mjs';

function getHostIp() {
  return process.env.HOST_IP_ADDRESS || 'localhost';
}

function getProfile() {
  return process.env.REMOTE_PROFILE || 'dev';
}

function getStaticBaseUrl() {
  return LOCAL_STATIC_BASE_URL;
}

function getRegistryUrl() {
  return LOCAL_REGISTRY_URL;
}

function resolveRemoteBaseUrl(remoteName, profile = getProfile()) {
  const entry = REMOTES_CATALOG[remoteName];
  if (profile === 'static' || profile === 'external') {
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
      version: entry.version,
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
        version: entry.version,
        enabled: true,
        exposes: [`./${remoteName.replace('Travel', '')}Screen`],
        screen: remoteName.replace('Travel', ''),
        startCommand: `pnpm start:travel-${entry.slug}`,
      };
    }),
  };
}

export {
  REMOTES_CATALOG,
  REMOTE_NAMES,
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
