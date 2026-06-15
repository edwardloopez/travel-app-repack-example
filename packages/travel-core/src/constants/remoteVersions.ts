import remoteVersionsJson from 'travel-sdk/lib/remoteVersions.json';

export const REMOTE_VERSIONS = remoteVersionsJson as Record<string, string>;

export function getCatalogRemoteVersion(remoteName: string): string {
  return REMOTE_VERSIONS[remoteName] ?? '0.0.0';
}
