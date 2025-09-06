/**
 * Bundle Versioning Utilities for Module Federation
 *
 * Handles version-aware bundle loading and cache management
 */

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
  };
}

/**
 * Default remote configurations with versioning
 * This can be loaded from a remote config service in production
 */
export const REMOTE_CONFIGS: VersionedRemoteConfig = {
  TravelWeather: {
    version: '1.0.0',
    name: 'TravelWeather',
  },
  TravelDestinations: {
    version: '1.0.0',
    name: 'TravelDestinations',
  },
  TravelSearch: {
    version: '1.0.0',
    name: 'TravelSearch',
  },
  TravelPhotos: {
    version: '1.0.0',
    name: 'TravelPhotos',
  },
};

/**
 * Generate versioned cache key
 */
export function generateVersionedCacheKey(
  remoteName: string,
  platform: string,
  version: string
): string {
  return `bundle_${remoteName}_${platform}_${version}`;
}

/**
 * Check if a bundle version is compatible
 */
export function isVersionCompatible(
  currentVersion: string,
  cachedVersion: string
): boolean {
  // Simple semantic versioning check
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  const [cachedMajor, cachedMinor] = cachedVersion.split('.').map(Number);

  // Allow same major version, any minor/patch version
  return currentMajor === cachedMajor && currentMinor >= cachedMinor;
}

/**
 * Load remote configuration from server
 * In production, this would fetch from your backend/CDN
 */
export async function loadRemoteConfig(): Promise<VersionedRemoteConfig> {
  try {
    // In development, return static config
    if (__DEV__) {
      return REMOTE_CONFIGS;
    }

    // In production, fetch from your config service
    const response = await fetch('https://api.yourapp.com/remote-config');
    const config = await response.json();
    return config;
  } catch (error) {
    console.warn('Failed to load remote config, using defaults:', error);
    return REMOTE_CONFIGS;
  }
}

/**
 * Extract version from bundle URL
 */
export function extractVersionFromUrl(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}
