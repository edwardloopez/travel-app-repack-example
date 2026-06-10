import { Script, ScriptManager } from '@callstack/repack/client';
import { Platform } from 'react-native';
import { getActiveRemoteConfig, getContainerUrl } from './bundleVersioning';

let installed = false;

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
        return {
          url: Script.getRemoteURL(containerUrl, { excludeExtension: true }),
          cache: !__DEV__,
        };
      }

      if (caller && caller in config) {
        if (typeof scriptId === 'string' && /^https?:\/\//.test(scriptId)) {
          return {
            url: Script.getRemoteURL(scriptId, { excludeExtension: true }),
            cache: !__DEV__,
          };
        }

        const containerUrl = getContainerUrl(caller, platform);
        if (scriptId === caller) {
          return {
            url: Script.getRemoteURL(containerUrl, { excludeExtension: true }),
            cache: !__DEV__,
          };
        }

        const baseUrl = containerUrl.replace(/\/[^/]+$/, '');
        const chunkUrl = `${baseUrl}/${scriptId}`;
        return {
          url: Script.getRemoteURL(chunkUrl, { excludeExtension: true }),
          cache: !__DEV__,
        };
      }

      return undefined;
    },
    { key: 'travel-script-resolver', priority: 10 }
  );
}
