import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeRemoteArtifacts } from '../packages/travel-sdk/lib/writeRemoteArtifacts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const { registryPath, versionsPath } = writeRemoteArtifacts(rootDir);

console.log(`Generated ${registryPath}`);
console.log(`Generated ${versionsPath}`);
