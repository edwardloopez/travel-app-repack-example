import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REMOTES_CATALOG } from '../packages/travel-sdk/lib/remotesCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const PLATFORMS = ['ios', 'android'] as const;
type Platform = (typeof PLATFORMS)[number];

type RemoteApp = {
  name: string;
  slug: string;
  dir: string;
  filter: string;
};

const REMOTE_APPS: RemoteApp[] = Object.entries(REMOTES_CATALOG).map(
  ([name, entry]) => ({
    name,
    slug: entry.slug,
    dir: `travel-${entry.slug}`,
    filter: name,
  })
);

function printUsage() {
  const remoteList = REMOTE_APPS.map(
    remote => `  ${remote.slug.padEnd(14)} (${remote.name})`
  ).join('\n');

  console.log(`
Usage: tsx scripts/build-remotes.ts [platform] [remote...]

  platform   ios | android (default: android)
  remote     slug, MF name, or app dir — omit to build all

Examples:
  tsx scripts/build-remotes.ts ios
  tsx scripts/build-remotes.ts android weather
  tsx scripts/build-remotes.ts weather search photos
  tsx scripts/build-remotes.ts ios TravelWeather TravelSearch

Available remotes:
${remoteList}
`);
}

function parseArgs(argv: string[]): { platform: Platform; selectors: string[] } {
  let platform: Platform = 'android';
  const selectors: string[] = [];

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (PLATFORMS.includes(arg as Platform)) {
      platform = arg as Platform;
      continue;
    }

    selectors.push(arg);
  }

  return { platform, selectors };
}

function resolveRemote(selector: string): RemoteApp | undefined {
  const normalized = selector.toLowerCase();

  return REMOTE_APPS.find(
    remote =>
      remote.name.toLowerCase() === normalized ||
      remote.slug.toLowerCase() === normalized ||
      remote.dir.toLowerCase() === normalized ||
      remote.dir.toLowerCase() === `travel-${normalized}`
  );
}

function resolveRemotes(selectors: string[]): RemoteApp[] {
  if (selectors.length === 0) {
    return REMOTE_APPS;
  }

  const resolved: RemoteApp[] = [];
  const unknown: string[] = [];

  for (const selector of selectors) {
    const remote = resolveRemote(selector);
    if (!remote) {
      unknown.push(selector);
      continue;
    }

    if (!resolved.some(entry => entry.name === remote.name)) {
      resolved.push(remote);
    }
  }

  if (unknown.length > 0) {
    console.error(`\nUnknown remote(s): ${unknown.join(', ')}\n`);
    printUsage();
    process.exit(1);
  }

  return resolved;
}

const { platform, selectors } = parseArgs(process.argv.slice(2));
const remotesToBuild = resolveRemotes(selectors);
const codeSigningKeyPath = path.join(rootDir, 'code-signing.pem');

if (!fs.existsSync(codeSigningKeyPath)) {
  console.error('\nMissing code-signing.pem. Run: pnpm setup:code-signing\n');
  process.exit(1);
}

function copyDist(appDir: string, slug: string) {
  const sourceDir = path.join(
    rootDir,
    'apps',
    appDir,
    'build',
    'generated',
    platform
  );
  const targetDir = path.join(rootDir, 'remotes-dist', slug, platform);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Build output not found: ${sourceDir}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`Copied ${slug}/${platform} -> remotes-dist/${slug}/${platform}`);
}

console.log(
  `\nBuilding ${remotesToBuild.length} remote(s) for ${platform}: ${remotesToBuild.map(r => r.slug).join(', ')}\n`
);

for (const remote of remotesToBuild) {
  console.log(`\nBuilding ${remote.name} (${platform})...`);
  const result = spawnSync(
    'pnpm',
    ['--filter', remote.filter, 'bundle:remote:' + platform],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  copyDist(remote.dir, remote.slug);
}

console.log(
  `\nDone. Built ${remotesToBuild.length} remote(s) for ${platform}.`
);
