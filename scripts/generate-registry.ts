import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistryJson } from '../packages/travel-sdk/lib/remoteProfiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'remotes-dist', 'remote-registry.json');

const registry = buildRegistryJson('prod');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

console.log(`Generated ${outputPath}`);
