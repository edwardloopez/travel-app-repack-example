const REMOTE_SLUGS = {
  TravelWeather: 'weather',
  TravelDestinations: 'destinations',
  TravelSearch: 'search',
  TravelPhotos: 'photos',
};

const DEV_PORTS = {
  TravelWeather: 9000,
  TravelDestinations: 9001,
  TravelSearch: 9002,
  TravelPhotos: 9003,
};

const REMOTE_VERSIONS = {
  TravelWeather: '1.0.0',
  TravelDestinations: '1.0.0',
  TravelSearch: '1.0.0',
  TravelPhotos: '1.0.0',
};

function getHostIp() {
  return process.env.HOST_IP_ADDRESS || 'localhost';
}

function getProfile() {
  return process.env.REMOTE_PROFILE || 'dev';
}

function getStaticBaseUrl() {
  return process.env.REMOTE_STATIC_BASE_URL || 'http://localhost:4100';
}

function getRegistryUrl() {
  return (
    process.env.REMOTE_REGISTRY_URL ||
    `${getStaticBaseUrl()}/remote-registry.json`
  );
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
  return Object.keys(REMOTE_SLUGS).reduce((acc, remoteName) => {
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
  return Object.keys(REMOTE_SLUGS).reduce((acc, remoteName) => {
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
    remotes: Object.keys(REMOTE_SLUGS).map(remoteName => ({
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
