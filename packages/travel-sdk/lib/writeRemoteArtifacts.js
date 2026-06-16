import fs from 'node:fs';
import path from 'node:path';
import { SDK_ROOT } from './paths.js';
import { buildRegistryJson } from './remoteProfiles.js';

export function writeRemoteArtifacts(repoRoot = path.resolve(SDK_ROOT, '../..')) {
  const devRegistry = buildRegistryJson('dev');
  const prodRegistry = buildRegistryJson('prod');

  const devRegistryPath = path.join(SDK_ROOT, 'lib', 'remote-registry.dev.json');
  const prodBundlePath = path.join(SDK_ROOT, 'lib', 'remote-registry.prod.json');
  const cdnRegistryPath = path.join(repoRoot, 'remotes-dist', 'remote-registry.json');

  fs.mkdirSync(path.dirname(cdnRegistryPath), { recursive: true });
  fs.writeFileSync(devRegistryPath, JSON.stringify(devRegistry, null, 2));
  fs.writeFileSync(prodBundlePath, JSON.stringify(prodRegistry, null, 2));
  fs.writeFileSync(cdnRegistryPath, JSON.stringify(prodRegistry, null, 2));

  return {
    devRegistryPath,
    prodBundlePath,
    cdnRegistryPath,
    devRegistry,
    prodRegistry,
  };
}
