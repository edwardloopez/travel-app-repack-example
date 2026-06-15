import type { FederationRuntimePlugin } from '@module-federation/runtime-tools/runtime';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
/** Must match travel-core manifestCache.ts legacyCacheKey format. */
const MANIFEST_CACHE_PREFIX = 'mf_manifest_';

type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/** Session cache when AsyncStorage native module is not ready yet. */
const memoryManifestCache = new Map<string, string>();

let asyncStorageModule: AsyncStorageLike | null | undefined;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function manifestStorageKey(url: string): string {
  return `${MANIFEST_CACHE_PREFIX}${url}`;
}

/**
 * Lazy AsyncStorage access — top-level import crashes at app launch because
 * MF runtime plugins load before the native bridge is ready ([runtime not ready]).
 */
function getAsyncStorage(): AsyncStorageLike | null {
  if (asyncStorageModule !== undefined) {
    return asyncStorageModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const key = manifestStorageKey(url);
  const memory = memoryManifestCache.get(key);
  if (memory) {
    return memory;
  }

  const storage = getAsyncStorage();
  if (!storage) {
    return null;
  }

  try {
    return await storage.getItem(key);
  } catch (error) {
    console.warn('mf-fetch-plugin: failed to read manifest cache', error);
    return null;
  }
}

async function setCachedManifest(url: string, body: string): Promise<void> {
  const key = manifestStorageKey(url);
  memoryManifestCache.set(key, body);

  const storage = getAsyncStorage();
  if (!storage) {
    return;
  }

  try {
    await storage.setItem(key, body);
  } catch (error) {
    console.warn('mf-fetch-plugin: failed to write manifest cache', error);
  }
}

function offlineManifestResponse(cached: string): Response {
  return new Response(cached, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POC fetch plugin: direct manifest/bundle download without auth.
 * Self-contained (no travel-core) — runs inside the MF runtime plugin bundle.
 * Caches mf-manifest.json for offline replay when CDN is down.
 */
export default function (): FederationRuntimePlugin {
  return {
    name: 'mf-fetch-plugin',
    async fetch(url: string, options: RequestInit) {
      const startedAt = Date.now();
      const isManifest = url.includes('mf-manifest.json');
      const isContainer = url.includes('.container.js.bundle');

      console.log('MF Fetch:', {
        url,
        type: isManifest ? 'manifest' : isContainer ? 'container' : 'asset',
      });
      console.log('[MF:Trace] 8.fetch.start', {
        url,
        type: isManifest ? 'manifest' : isContainer ? 'container' : 'chunk/asset',
      });

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

          if (response.ok && isManifest) {
            const body = await response.clone().text();
            await setCachedManifest(url, body);
          }

          console.log('MF Fetch complete:', {
            url,
            status: response.status,
            durationMs: Date.now() - startedAt,
            attempts: attempt,
          });
          console.log('[MF:Trace] 8.fetch.ok', {
            url,
            status: response.status,
            durationMs: Date.now() - startedAt,
            attempts: attempt,
          });

          return response;
        } catch (error) {
          lastError = error;
          if (attempt < MAX_ATTEMPTS) {
            console.warn(
              `MF Fetch retry ${attempt}/${MAX_ATTEMPTS}: ${url}`,
              error
            );
            await sleep(BASE_DELAY_MS * attempt);
            continue;
          }
        }
      }

      if (isManifest) {
        const cached = await getCachedManifest(url);
        if (cached) {
          console.log('[MF:Trace] 8.fetch.offlineManifest', { url });
          return offlineManifestResponse(cached);
        }
      }

      throw lastError;
    },
  };
}
