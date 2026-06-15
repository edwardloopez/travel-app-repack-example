import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, 'remotesCatalog.json');

export const REMOTES_CATALOG = JSON.parse(
  fs.readFileSync(catalogPath, 'utf8')
);

export const REMOTE_NAMES = Object.keys(REMOTES_CATALOG);
