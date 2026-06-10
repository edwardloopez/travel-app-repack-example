import catalogJson from '../../../travel-sdk/lib/remotesCatalog.json';

export interface RemoteCatalogEntry {
  slug: string;
  devPort: number;
  version: string;
}

export const REMOTES_CATALOG = catalogJson as Record<string, RemoteCatalogEntry>;

export const REMOTE_NAMES = Object.keys(REMOTES_CATALOG);

export const REMOTE_SLUGS: Record<string, string> = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].slug])
);

export const DEV_PORTS: Record<string, number> = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].devPort])
);

export const REMOTE_VERSIONS: Record<string, string> = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].version])
);

export function getRemoteCatalogEntry(
  remoteName: string
): RemoteCatalogEntry | undefined {
  return REMOTES_CATALOG[remoteName];
}
