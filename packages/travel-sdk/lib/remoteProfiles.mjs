import {
  LOCAL_REGISTRY_URL,
  LOCAL_STATIC_BASE_URL,
} from './remoteDefaults.mjs';
import {
  DEV_PORTS,
  REMOTE_NAMES,
  REMOTE_SLUGS,
  REMOTE_VERSIONS,
} from './remotesCatalog.mjs';

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
  if (profile === 'static' || profile === 'external') {
    const slug = REMOTE_SLUGS[remoteName];
    return `${getStaticBaseUrl()}/${slug}`;
  }

  const port = DEV_PORTS[remoteName];
  return `http://${getHostIp()}:${port}`;
}

function getManifestEntry(remoteName, platform, profile = getProfile()) {
  const baseUrl = resolveRemoteBaseUrl(remoteName, profile);
  return `${remoteName}@${baseUrl}/${platform}/mf-manifest.json`;
}

function getRemoteConfigs(profile = getProfile()) {
  return REMOTE_NAMES.reduce((acc, remoteName) => {
    acc[remoteName] = {
      version: REMOTE_VERSIONS[remoteName],
      name: remoteName,
      url: resolveRemoteBaseUrl(remoteName, profile),
      slug: REMOTE_SLUGS[remoteName],
      port: DEV_PORTS[remoteName],
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
    remotes: REMOTE_NAMES.map(remoteName => ({
      name: remoteName,
      entry: `${baseUrl}/${REMOTE_SLUGS[remoteName]}/\${platform}/mf-manifest.json`,
      version: REMOTE_VERSIONS[remoteName],
      enabled: true,
      exposes: [`./${remoteName.replace('Travel', '')}Screen`],
      screen: remoteName.replace('Travel', ''),
      startCommand: `pnpm start:travel-${REMOTE_SLUGS[remoteName]}`,
    })),
  };
}

export {
  REMOTE_SLUGS,
  DEV_PORTS,
  REMOTE_VERSIONS,
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
