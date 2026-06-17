export const MANIFEST_CACHE_PREFIX = 'mf_manifest_';
export const REGISTRY_SNAPSHOT_KEY = 'mf_registry_snapshot';

export function versionedManifestKey(remoteName, platform, version) {
  return `${MANIFEST_CACHE_PREFIX}${remoteName}_${platform}_${version}`;
}

/** Legacy URL key — read fallback during migration; avoid new writes when versioned key is available. */
export function legacyManifestKey(manifestUrl) {
  return `${MANIFEST_CACHE_PREFIX}${manifestUrl}`;
}

/**
 * Resolve remote + platform (+ version from snapshot entry) from a manifest URL.
 * @param {string} url
 * @param {Array<{ name: string; slug?: string; devPort?: number; version: string; entry?: string }>} remotes
 */
export function resolveRemoteFromManifestUrl(url, remotes = []) {
  const platformMatch = url.match(/\/(ios|android)\/mf-manifest\.json/);
  if (!platformMatch) {
    return null;
  }

  const platform = platformMatch[1];

  for (const remote of remotes) {
    if (remote.slug && url.includes(`/${remote.slug}/${platform}/`)) {
      return {
        remoteName: remote.name,
        platform,
        version: remote.version,
      };
    }

    if (remote.devPort && url.includes(`:${remote.devPort}/`)) {
      return {
        remoteName: remote.name,
        platform,
        version: remote.version,
      };
    }

    if (remote.entry) {
      const entryBase = remote.entry.replace(/\/mf-manifest\.json$/, '');
      if (url.includes(entryBase)) {
        return {
          remoteName: remote.name,
          platform,
          version: remote.version,
        };
      }
    }
  }

  return null;
}
