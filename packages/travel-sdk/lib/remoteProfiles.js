import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEV_MF_HOST,
  LOCAL_REGISTRY_URL,
  LOCAL_STATIC_BASE_URL,
} from './remoteDefaults.js';
import { REMOTES_CONFIG } from './remotes.config.js';
import { readRemotePackageVersion } from './readRemotePackageVersion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_REGISTRY_PATH = path.join(__dirname, 'remote-registry.dev.json');

function getHostIp() {
  return DEV_MF_HOST;
}

function getStaticBaseUrl() {
  return LOCAL_STATIC_BASE_URL;
}

function getRegistryUrl() {
  return LOCAL_REGISTRY_URL;
}

export function resolveTemplate(template, platform, host = getHostIp()) {
  return template
    .replace(/\$\{platform\}/g, platform)
    .replace(/\$\{host\}/g, host);
}

function buildRemoteEntry(remote, profile) {
  if (profile === 'dev') {
    return `http://${getHostIp()}:${remote.devPort}/\${platform}/mf-manifest.json`;
  }

  return `${getStaticBaseUrl()}/${remote.slug}/\${platform}/mf-manifest.json`;
}

export function buildRegistryJson(profile) {
  return {
    hostMinVersion: '1.0.0',
    profile,
    remotes: REMOTES_CONFIG.map(remote => ({
      name: remote.name,
      slug: remote.slug,
      devPort: remote.devPort,
      entry: buildRemoteEntry(remote, profile),
      version: readRemotePackageVersion(remote.name),
      enabled: true,
      exposes: remote.exposes,
      title: remote.title,
      description: remote.description,
      screen: remote.screen,
      color: remote.color,
      icon: remote.icon,
      startCommand:
        profile === 'dev'
          ? `pnpm start:travel-${remote.slug}`
          : 'pnpm serve:remotes',
    })),
  };
}

function readDevRegistryFile() {
  return JSON.parse(fs.readFileSync(DEV_REGISTRY_PATH, 'utf8'));
}

export function buildHostRemotes(platform = 'ios') {
  const registry = readDevRegistryFile();

  return registry.remotes.reduce((acc, remote) => {
    acc[remote.name] = `${remote.name}@${resolveTemplate(remote.entry, platform)}`;
    return acc;
  }, {});
}

export {
  getHostIp,
  getRegistryUrl,
  getStaticBaseUrl,
  DEV_REGISTRY_PATH,
};
