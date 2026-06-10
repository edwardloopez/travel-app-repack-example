import type { FederationRuntimePlugin } from '@module-federation/runtime-tools/runtime';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * POC fetch plugin: direct manifest/bundle download without auth.
 * Retries transient network failures before surfacing an error.
 * FUTURE: add Bearer token, manifest signature verification, and offline fallback.
 */
export default function (): FederationRuntimePlugin {
  return {
    name: 'poc-fetch-plugin',
    async fetch(url: string, options: RequestInit) {
      const startedAt = Date.now();
      const isManifest = url.includes('mf-manifest.json');
      const isContainer = url.includes('.container.js.bundle');

      console.log('MF Fetch:', {
        url,
        type: isManifest ? 'manifest' : isContainer ? 'container' : 'asset',
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

          console.log('MF Fetch complete:', {
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

      throw lastError;
    },
  };
}
