declare module 'travel-sdk/lib/remote-registry.dev.json' {
  import type { RemoteRegistry } from '../utils/remoteRegistry';

  const registry: RemoteRegistry;
  export default registry;
}

declare module 'travel-sdk/lib/remote-registry.prod.json' {
  import type { RemoteRegistry } from '../utils/remoteRegistry';

  const registry: RemoteRegistry;
  export default registry;
}

declare module 'travel-sdk/lib/manifestCacheKeys.js' {
  export const MANIFEST_CACHE_PREFIX: string;
  export const REGISTRY_SNAPSHOT_KEY: string;

  export function versionedManifestKey(
    remoteName: string,
    platform: string,
    version: string
  ): string;

  export function legacyManifestKey(manifestUrl: string): string;

  export function resolveRemoteFromManifestUrl(
    url: string,
    remotes?: Array<{
      name: string;
      slug?: string;
      devPort?: number;
      version: string;
      entry?: string;
    }>
  ): { remoteName: string; platform: string; version: string } | null;
}
