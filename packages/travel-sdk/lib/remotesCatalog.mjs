import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, 'remotesCatalog.json');

/** @type {Record<string, { slug: string; devPort: number; version: string }>} */
const REMOTES_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const REMOTE_NAMES = Object.keys(REMOTES_CATALOG);

const REMOTE_SLUGS = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].slug])
);

const DEV_PORTS = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].devPort])
);

const REMOTE_VERSIONS = Object.fromEntries(
  REMOTE_NAMES.map(name => [name, REMOTES_CATALOG[name].version])
);

function getRemoteCatalogEntry(remoteName) {
  return REMOTES_CATALOG[remoteName];
}

export {
  REMOTES_CATALOG,
  REMOTE_NAMES,
  REMOTE_SLUGS,
  DEV_PORTS,
  REMOTE_VERSIONS,
  getRemoteCatalogEntry,
};
