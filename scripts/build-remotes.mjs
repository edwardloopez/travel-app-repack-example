import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REMOTE_SLUGS } from '../packages/travel-sdk/lib/remoteProfiles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const REMOTE_APPS = [
  { name: 'TravelWeather', dir: 'travel-weather', filter: 'TravelWeather' },
  {
    name: 'TravelDestinations',
    dir: 'travel-destinations',
    filter: 'TravelDestinations',
  },
  { name: 'TravelSearch', dir: 'travel-search', filter: 'TravelSearch' },
  { name: 'TravelPhotos', dir: 'travel-photos', filter: 'TravelPhotos' },
];

const platform = process.argv[2] || 'android';

function copyDist(appDir, slug) {
  const sourceDir = path.join(rootDir, 'apps', appDir, 'build', 'generated', platform);
  const targetDir = path.join(rootDir, 'remotes-dist', slug, platform);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Build output not found: ${sourceDir}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`Copied ${slug}/${platform} -> remotes-dist/${slug}/${platform}`);
}

for (const remote of REMOTE_APPS) {
  console.log(`\nBuilding ${remote.name} (${platform})...`);
  const result = spawnSync(
    'pnpm',
    [
      '--filter',
      remote.filter,
      'bundle:remote:' + platform,
    ],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  copyDist(remote.dir, REMOTE_SLUGS[remote.name]);
}

console.log(`\nAll remotes built for ${platform}.`);
