import { Script, ScriptManager } from '@callstack/repack/client';
import { Platform } from 'react-native';
import { getActiveRemoteConfig, getContainerUrl } from './bundleVersioning';

let installed = false;

const SCRIPT_FETCH_OPTIONS = {
  cache: !__DEV__,
  retry: 3,
  retryDelay: 1000,
} as const;

function remoteScriptLocator(url: string) {
  return {
    url: Script.getRemoteURL(url, { excludeExtension: true }),
    ...SCRIPT_FETCH_OPTIONS,
  };
}

/**
 * Fallback resolver when RepackResolverPlugin lacks referenceUrl
 * (e.g. prefetch by container name or chunk loads after manifest fetch).
 */
export function setupTravelScriptResolver() {
  if (installed) {
    return;
  }
  installed = true;

  ScriptManager.shared.addResolver(
    async (scriptId, caller, referenceUrl) => {
      if (referenceUrl) {
        return undefined;
      }

      const config = getActiveRemoteConfig();
      const platform = Platform.OS;

      if (typeof scriptId === 'string' && scriptId in config) {
        const containerUrl = getContainerUrl(scriptId, platform);
        return remoteScriptLocator(containerUrl);
      }

      if (caller && caller in config) {
        if (typeof scriptId === 'string' && /^https?:\/\//.test(scriptId)) {
          return remoteScriptLocator(scriptId);
        }

        const containerUrl = getContainerUrl(caller, platform);
        if (scriptId === caller) {
          return remoteScriptLocator(containerUrl);
        }

        const baseUrl = containerUrl.replace(/\/[^/]+$/, '');
        const chunkUrl = `${baseUrl}/${scriptId}`;
        return remoteScriptLocator(chunkUrl);
      }

      return undefined;
    },
    { key: 'travel-script-resolver', priority: 10 }
  );
}
