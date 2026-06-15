import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './paths.js';
import { REMOTES_CATALOG } from './remotesCatalog.js';

function readPackageVersion(remoteName) {
  const entry = REMOTES_CATALOG[remoteName];
  const pkgPath = path.join(
    REPO_ROOT,
    'apps',
    `travel-${entry.slug}`,
    'package.json'
  );

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Missing package.json for remote ${remoteName}: ${pkgPath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) {
    throw new Error(`Missing version in ${pkgPath}`);
  }

  return pkg.version;
}

export function getRemotePackageVersion(remoteName) {
  return readPackageVersion(remoteName);
}

export function getAllRemotePackageVersions() {
  return Object.fromEntries(
    Object.keys(REMOTES_CATALOG).map(name => [name, readPackageVersion(name)])
  );
}
