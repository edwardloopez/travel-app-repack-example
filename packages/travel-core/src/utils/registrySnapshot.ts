import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REGISTRY_SNAPSHOT_KEY,
  resolveRemoteFromManifestUrl as resolveFromSnapshot,
} from 'travel-sdk/lib/manifestCacheKeys.js';
import type { RemoteRegistry } from './remoteRegistry';

export type RegistrySnapshot = {
  remotes: Array<{
    name: string;
    slug: string;
    devPort?: number;
    version: string;
    entry: string;
  }>;
};

export async function persistRegistrySnapshot(
  registry: RemoteRegistry
): Promise<void> {
  const snapshot: RegistrySnapshot = {
    remotes: registry.remotes.map(remote => ({
      name: remote.name,
      slug: remote.slug,
      devPort: remote.devPort,
      version: remote.version,
      entry: remote.entry,
    })),
  };

  await AsyncStorage.setItem(REGISTRY_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export async function readRegistrySnapshot(): Promise<RegistrySnapshot | null> {
  const raw = await AsyncStorage.getItem(REGISTRY_SNAPSHOT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RegistrySnapshot;
  } catch {
    return null;
  }
}

export async function resolveRemoteFromManifestUrlWithSnapshot(url: string) {
  const snapshot = await readRegistrySnapshot();
  if (!snapshot) {
    return null;
  }

  return resolveFromSnapshot(url, snapshot.remotes);
}
