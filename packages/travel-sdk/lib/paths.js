import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findTravelSdkRoot(startDir) {
  let dir = startDir;

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name === 'travel-sdk') {
        return dir;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error('Could not locate travel-sdk package root');
    }
    dir = parent;
  }
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const SDK_ROOT = findTravelSdkRoot(moduleDir);
export const REPO_ROOT = path.resolve(SDK_ROOT, '../..');
export const HOST_APP_DIR = path.join(REPO_ROOT, 'apps/travel-host');
