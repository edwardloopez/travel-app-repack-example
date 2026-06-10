import type { FederationRuntimePlugin } from '@module-federation/runtime-tools/runtime';

/**
 * POC fetch plugin: direct manifest/bundle download without auth.
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

      const response = await fetch(url, options);

      console.log('MF Fetch complete:', {
        url,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    },
  };
}
