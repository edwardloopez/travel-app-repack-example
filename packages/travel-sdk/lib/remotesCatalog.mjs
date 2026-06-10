import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, 'remotesCatalog.json');

/** @type {Record<string, { slug: string; devPort: number; version: string }>} */
const REMOTES_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const REMOTE_NAMES = Object.keys(REMOTES_CATALOG);

export { REMOTES_CATALOG, REMOTE_NAMES };
