import type { ModuleFederationRuntimePlugin } from '@module-federation/runtime';
import {
  legacyManifestKey,
  REGISTRY_SNAPSHOT_KEY,
  resolveRemoteFromManifestUrl,
  versionedManifestKey,
} from '../../packages/travel-sdk/lib/manifestCacheKeys.js';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

type RegistrySnapshot = {
  remotes: Array<{
    name: string;
    slug?: string;
    devPort?: number;
    version: string;
    entry?: string;
  }>;
};

/** Session cache when AsyncStorage native module is not ready yet. */
const memoryManifestCache = new Map<string, string>();

let asyncStorageModule: AsyncStorageLike | null | undefined;
let registrySnapshot: RegistrySnapshot | null | undefined;

/**
 * POC fetch plugin: direct manifest/bundle download without auth.
 * Self-contained (no travel-core) — runs inside the MF runtime plugin bundle.
 *
 * Manifest offline: primary path in `fetch` (return cached Response).
 * Backup path in `errorLoadRemote` when resolution still fails (`afterResolve`).
 */
export default function (): ModuleFederationRuntimePlugin {
  return {
    name: 'mf-fetch-plugin',

    async fetch(url: string, options: RequestInit) {
      const isManifest = url.includes('mf-manifest.json');

      if (isManifest) {
        return fetchManifest(url, options);
      }

      return fetchWithRetries(url, options, {
        type: url.includes('.container.js.bundle') ? 'container' : 'chunk/asset',
      });
    },

    async errorLoadRemote(args) {
      const { id, error, lifecycle } = args;
      if (lifecycle !== 'afterResolve') {
        console.error('[MF:Trace] 8.fetch.error', { id, lifecycle, error });
        return;
      }

      const cached = await getCachedManifest(id);
      if (!cached) {
        console.error('[MF:Trace] 8.fetch.error', { id, lifecycle, error, cacheHit: false });
        return;
      }

      console.log('[MF:Trace] 8.fetch.errorLoadRemote.cache', { id });
      return JSON.parse(cached) as unknown;
    },
  };
}

async function fetchManifest(url: string, options: RequestInit): Promise<Response> {
  const startedAt = Date.now();

  const cached = await offlineManifestResponse(url);
  if (cached) {
    console.log('[MF:Trace] 8.fetch.cacheHit', {
      url,
      type: 'manifest',
      durationMs: Date.now() - startedAt,
    });
    return cached;
  }

  console.log('[MF:Trace] 8.fetch.start', { url, type: 'manifest' });

  try {
    const response = await fetchWithRetries(url, options, { type: 'manifest' });

    if (response.ok) {
      await setCachedManifest(url, await response.clone().text());
      return response;
    }

    const offline = await offlineManifestResponse(url);
    if (offline) {
      console.log('[MF:Trace] 8.fetch.offlineManifest', {
        url,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return offline;
    }

    return response;
  } catch (error) {
    const offline = await offlineManifestResponse(url);
    if (offline) {
      console.log('[MF:Trace] 8.fetch.offlineManifest', {
        url,
        durationMs: Date.now() - startedAt,
      });
      return offline;
    }

    throw error;
  }
}

async function fetchWithRetries(
  url: string,
  options: RequestInit,
  meta: { type: string }
): Promise<Response> {
  const startedAt = Date.now();
  console.log('[MF:Trace] 8.fetch.start', { url, type: meta.type });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && attempt < MAX_ATTEMPTS) {
        console.warn(
          `MF Fetch retry ${attempt}/${MAX_ATTEMPTS}: ${url} (${response.status})`
        );
        await sleep(BASE_DELAY_MS * attempt);
        continue;
      }

      console.log('[MF:Trace] 8.fetch.ok', {
        url,
        type: meta.type,
        status: response.status,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
      });

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`MF Fetch retry ${attempt}/${MAX_ATTEMPTS}: ${url}`, error);
        await sleep(BASE_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

async function offlineManifestResponse(url: string): Promise<Response | null> {
  const cached = await getCachedManifest(url);
  if (!cached) {
    return null;
  }

  return new Response(cached, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readRegistrySnapshot(): Promise<RegistrySnapshot | null> {
  if (registrySnapshot !== undefined) {
    return registrySnapshot;
  }

  const storage = getAsyncStorage();
  if (!storage) {
    registrySnapshot = null;
    return null;
  }

  try {
    const raw = await storage.getItem(REGISTRY_SNAPSHOT_KEY);
    registrySnapshot = raw ? (JSON.parse(raw) as RegistrySnapshot) : null;
  } catch {
    registrySnapshot = null;
  }

  return registrySnapshot;
}

async function resolveManifestRemote(url: string) {
  const snapshot = await readRegistrySnapshot();
  if (!snapshot) {
    return null;
  }

  return resolveRemoteFromManifestUrl(url, snapshot.remotes);
}

function getAsyncStorage(): AsyncStorageLike | null {
  if (asyncStorageModule !== undefined) {
    return asyncStorageModule;
  }

  try {
    const mod = require('@react-native-async-storage/async-storage') as {
      default?: AsyncStorageLike;
    };
    asyncStorageModule = mod?.default ?? null;
  } catch (error) {
    console.warn('mf-fetch-plugin: AsyncStorage not available yet', error);
    asyncStorageModule = null;
  }

  return asyncStorageModule;
}

async function getCachedManifest(url: string): Promise<string | null> {
  const resolved = await resolveManifestRemote(url);

  if (resolved) {
    const versionedKey = versionedManifestKey(
      resolved.remoteName,
      resolved.platform,
      resolved.version
    );
    const memory = memoryManifestCache.get(versionedKey);
    if (memory) {
      return memory;
    }

    const storage = getAsyncStorage();
    if (storage) {
      try {
        const versioned = await storage.getItem(versionedKey);
        if (versioned) {
          return versioned;
        }
      } catch (error) {
        console.warn('mf-fetch-plugin: failed to read manifest cache', error);
      }
    }
  }

  const legacyKey = legacyManifestKey(url);
  const memory = memoryManifestCache.get(legacyKey);
  if (memory) {
    return memory;
  }

  const storage = getAsyncStorage();
  if (!storage) {
    return null;
  }

  try {
    return await storage.getItem(legacyKey);
  } catch (error) {
    console.warn('mf-fetch-plugin: failed to read manifest cache', error);
    return null;
  }
}

async function setCachedManifest(url: string, body: string): Promise<void> {
  const resolved = await resolveManifestRemote(url);

  if (resolved) {
    const versionedKey = versionedManifestKey(
      resolved.remoteName,
      resolved.platform,
      resolved.version
    );
    memoryManifestCache.set(versionedKey, body);

    const storage = getAsyncStorage();
    if (storage) {
      try {
        await storage.setItem(versionedKey, body);
      } catch (error) {
        console.warn('mf-fetch-plugin: failed to write manifest cache', error);
      }
    }
    return;
  }

  const legacyKey = legacyManifestKey(url);
  memoryManifestCache.set(legacyKey, body);

  const storage = getAsyncStorage();
  if (!storage) {
    return;
  }

  try {
    await storage.setItem(legacyKey, body);
  } catch (error) {
    console.warn('mf-fetch-plugin: failed to write manifest cache', error);
  }
}
