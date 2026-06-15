import fs from 'node:fs';
import path from 'node:path';
import { SDK_ROOT } from './paths.js';
import { buildRegistryJson } from './remoteProfiles.js';
import { getAllRemotePackageVersions } from './remoteVersions.js';

export function writeRemoteArtifacts(repoRoot = path.resolve(SDK_ROOT, '../..')) {
  const registry = buildRegistryJson('prod');
  const versions = getAllRemotePackageVersions();

  const registryPath = path.join(repoRoot, 'remotes-dist', 'remote-registry.json');
  const versionsPath = path.join(SDK_ROOT, 'lib', 'remoteVersions.json');

  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));

  return { registryPath, versionsPath, registry, versions };
}
