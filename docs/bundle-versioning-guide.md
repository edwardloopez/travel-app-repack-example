# Bundle Versioning System

## Overview

This document explains how to configure and manage bundle versioning for Module Federation in your React Native app using Re.Pack. The versioning system provides cache invalidation, update management, and reliable bundle loading across different versions.

## Key Features

- 🔄 **Automatic Cache Invalidation**: Old bundle versions are automatically invalidated when new versions are available
- 📦 **Version-Aware Storage**: Each bundle version is cached separately with semantic versioning support
- 🚀 **Preloading**: Critical bundles can be preloaded for better performance
- 🧹 **Cleanup**: Automatic cleanup of old versions to manage storage space
- 🔍 **Debug Tools**: Development screen for managing and monitoring cache

## Configuration

### 1. Remote Configuration

Configure your micro-frontends with versions in `packages/travel-core/src/utils/bundleVersioning.ts`:

```typescript
export const REMOTE_CONFIGS: VersionedRemoteConfig = {
  TravelWeather: {
    version: '1.2.3',  // Semantic versioning
    url: 'http://localhost:9000',
    fallbackUrl: 'https://cdn.yourapp.com/travel-weather',
  },
  TravelDestinations: {
    version: '2.0.1',
    url: 'http://localhost:9001',
    fallbackUrl: 'https://cdn.yourapp.com/travel-destinations',
  },
  // ... more remotes
};
```

### 2. Dynamic Configuration (Production)

For production, load configurations from your backend:

```typescript
// In production, this fetches from your API
export async function loadRemoteConfig(): Promise<VersionedRemoteConfig> {
  if (__DEV__) {
    return REMOTE_CONFIGS; // Static config for development
  }

  // Fetch from your backend/CDN
  const response = await fetch('https://api.yourapp.com/remote-config');
  const config = await response.json();
  return config;
}
```

### 3. Enhanced Module Federation Configuration

Use the versioned configuration in your rspack config:

```javascript
// rspack.config.mjs
import { generateVersionedRemotes, loadRemoteConfig } from 'travel-core';

const config = async env => {
  const { platform } = env;
  
  // Load remote configuration with versions
  const remoteConfig = await loadRemoteConfig();
  
  // Generate versioned remotes automatically
  const versionedRemotes = generateVersionedRemotes(platform, remoteConfig);
  // Result: {
  //   TravelWeather: 'TravelWeather@http://localhost:9000/ios/TravelWeather.container.js.bundle?v=1.2.3'
  // }
  
  return {
    // ... other config
    plugins: [
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'TravelHost',
        remotes: versionedRemotes, // Use versioned URLs
        shared: getSharedDependencies({ eager: true }),
      }),
    ],
  };
};
```

## Cache Management

### Version-Aware Caching

The enhanced `BundleCacheProvider` automatically handles versioning:

```typescript
// Cache keys are version-specific
// Example: "bundle_content_TravelWeather_ios_1.2.3"
// This allows multiple versions to coexist temporarily

// When a new version is detected:
// 1. Old version cache is invalidated
// 2. New version is downloaded and cached
// 3. App seamlessly uses the new version
```

### Cache Storage Structure

```
AsyncStorage:
├── bundle_content_TravelWeather_ios_1.2.3    (bundle content)
├── bundle_version_TravelWeather_ios_1.2.3    (version metadata)
├── bundle_content_TravelSearch_android_2.0.1 (bundle content)
├── bundle_version_TravelSearch_android_2.0.1 (version metadata)
└── ...
```

### Automatic Cleanup

```typescript
// Keeps only the latest 3 versions of each bundle
// Runs automatically when BundleCacheProvider initializes
await versionedStorage.cleanupOldVersions(3);
```

## Usage Examples

### 1. Basic Usage (Automatic)

Once configured, versioning works automatically:

```typescript
// Your existing lazy imports work unchanged
const WeatherScreen = React.lazy(() => import('TravelWeather/WeatherScreen'));

// Behind the scenes:
// 1. ScriptManager checks cache for TravelWeather v1.2.3
// 2. If cached, loads instantly
// 3. If not cached or version mismatch, downloads new version
// 4. Caches the new version for future use
```

### 2. Manual Cache Management

```typescript
import { useBundleCache } from 'travel-core';

function MyComponent() {
  const { 
    invalidateRemote, 
    invalidateAll, 
    getCacheStats, 
    checkForUpdates,
    preloadBundles 
  } = useBundleCache();

  // Clear specific remote cache
  const clearWeatherCache = () => {
    invalidateRemote('TravelWeather', 'ios', '1.2.3');
  };

  // Check for updates
  const handleUpdateCheck = async () => {
    const updatedRemotes = await checkForUpdates();
    console.log('Updated remotes:', updatedRemotes);
  };

  // Preload critical bundles
  const preloadCritical = async () => {
    await preloadBundles(['TravelWeather', 'TravelSearch'], 'ios');
  };

  // Get cache statistics
  const checkCacheSize = async () => {
    const stats = await getCacheStats();
    console.log(`${stats.totalBundles} bundles, ${stats.totalSize} bytes`);
  };
}
```

### 3. Bundle Update Flow

```typescript
// 1. App starts with cached TravelWeather v1.2.3
// 2. Remote config is updated to v1.3.0
// 3. Next time TravelWeather is loaded:
//    - Cache miss for v1.3.0 (new version)
//    - Downloads new version
//    - Caches v1.3.0
//    - Invalidates old v1.2.3 cache
//    - Uses new version
```

## Version Compatibility

The system supports semantic versioning with compatibility checks:

```typescript
// Version compatibility rules
function isVersionCompatible(currentVersion: string, cachedVersion: string): boolean {
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  const [cachedMajor, cachedMinor] = cachedVersion.split('.').map(Number);
  
  // Allow same major version, any minor/patch version
  return currentMajor === cachedMajor && currentMinor >= cachedMinor;
}

// Examples:
// isVersionCompatible('1.2.3', '1.2.0') // true - patch update
// isVersionCompatible('1.3.0', '1.2.5') // true - minor update  
// isVersionCompatible('2.0.0', '1.9.9') // false - major update
```

## Production Deployment

### 1. Backend Configuration Service

```typescript
// Your backend API response format
interface RemoteConfigResponse {
  remotes: {
    [name: string]: {
      version: string;
      url: string;
      fallbackUrl?: string;
      required?: boolean;
      preload?: boolean;
    };
  };
  cachePolicy: {
    maxVersions: number;
    maxAge: number;
  };
}
```

### 2. CDN Strategy

```typescript
const PRODUCTION_CONFIGS = {
  TravelWeather: {
    version: '1.2.3',
    url: 'https://cdn.yourapp.com/travel-weather',
    fallbackUrl: 'https://fallback-cdn.yourapp.com/travel-weather',
  },
  // Deploy bundles to CDN with version-specific paths
  // https://cdn.yourapp.com/travel-weather/ios/TravelWeather.container.js.bundle?v=1.2.3
};
```

### 3. Gradual Rollout

```typescript
// Feature flag integration
const remoteConfig = await loadRemoteConfig();

// Override versions based on feature flags
if (isFeatureFlagEnabled('weather-v2')) {
  remoteConfig.TravelWeather.version = '2.0.0-beta';
}
```

## Debugging and Monitoring

### 1. Development Debug Screen

Use the `BundleCacheDebugScreen` component (only in __DEV__):

- View cache statistics
- Manually clear cache
- Check for updates
- Preload bundles
- Monitor version changes

### 2. Console Logging

The system provides detailed logging in development:

```
BundleCache: Cache hit for TravelWeather_ios_1.2.3 (v1.2.3)
BundleCache: Version mismatch for TravelWeather_ios. Current: 1.3.0, Cached: 1.2.3
BundleCache: Cached TravelWeather_ios_1.3.0 (v1.3.0)
BundleCache: Cleaned up 2 old versions for TravelWeather_ios
```

### 3. Production Monitoring

```typescript
// Add analytics for bundle loading
ScriptManager.shared.on('loaded', (script) => {
  analytics.track('bundle_loaded', {
    scriptId: script.scriptId,
    loadTime: script.loadTime,
    fromCache: script.fromCache,
  });
});

ScriptManager.shared.on('error', (error) => {
  analytics.track('bundle_error', {
    error: error.message,
    scriptId: error.scriptId,
  });
});
```

## Best Practices

1. **Semantic Versioning**: Use semantic versioning (major.minor.patch) for proper compatibility checks
2. **Cache Limits**: Keep 2-3 versions cached to balance storage and performance
3. **Preloading**: Preload critical micro-frontends during app initialization
4. **Fallback URLs**: Always provide fallback URLs for production resilience
5. **Gradual Updates**: Use feature flags for gradual rollout of new versions
6. **Monitoring**: Track bundle loading performance and cache hit rates
7. **Testing**: Test version updates in staging environments

## Troubleshooting

### Common Issues

1. **Cache Not Invalidating**
   - Check version strings are properly formatted
   - Verify cache keys are generated correctly
   - Use debug screen to manually clear cache

2. **Bundle Not Loading**
   - Check network connectivity to bundle URLs
   - Verify version exists at the specified URL
   - Check console for ScriptManager errors

3. **Storage Issues**
   - Monitor AsyncStorage usage
   - Implement storage quota management
   - Clear cache if storage is full

### Debug Commands

```typescript
// Check current cache state
const stats = await BundleCacheManager.getCacheStats();

// Force cache invalidation
await BundleCacheManager.invalidateAll();

// Check for version updates
const updates = await BundleCacheManager.checkForUpdates();
```

This versioning system provides a robust foundation for managing Module Federation bundles in production while maintaining excellent performance through intelligent caching.
