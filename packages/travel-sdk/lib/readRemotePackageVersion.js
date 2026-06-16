import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './paths.js';
import { REMOTES_CONFIG } from './remotes.config.js';

export function readRemotePackageVersion(remoteName) {
  const entry = REMOTES_CONFIG.find(remote => remote.name === remoteName);
  if (!entry) {
    throw new Error(`Unknown remote: ${remoteName}`);
  }

  const pkgPath = path.join(REPO_ROOT, 'apps', `travel-${entry.slug}`, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Missing package.json for remote ${remoteName}: ${pkgPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) {
    throw new Error(`Missing version in ${pkgPath}`);
  }

  return pkg.version;
}
