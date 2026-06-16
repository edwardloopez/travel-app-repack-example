import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeRemoteArtifacts } from '../packages/travel-sdk/lib/writeRemoteArtifacts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const { devRegistryPath, prodBundlePath, cdnRegistryPath } =
  writeRemoteArtifacts(rootDir);

console.log(`Generated ${devRegistryPath}`);
console.log(`Generated ${prodBundlePath}`);
console.log(`Generated ${cdnRegistryPath}`);
