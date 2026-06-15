import catalogJson from 'travel-sdk/lib/remotesCatalog.json';

export interface RemoteCatalogEntry {
  slug: string;
  devPort: number;
}

export const REMOTES_CATALOG = catalogJson as Record<string, RemoteCatalogEntry>;

export const REMOTE_NAMES = Object.keys(REMOTES_CATALOG);
