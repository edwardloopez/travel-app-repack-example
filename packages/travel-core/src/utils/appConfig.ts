import { LOCAL_REGISTRY_URL } from '../constants/remoteDefaults';

/** Registry URL for prod: expo.extra first, then local default. */
export function getRemoteRegistryUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as {
      expoConfig?: { extra?: { remoteRegistryUrl?: string } };
    };
    const fromExtra = Constants.expoConfig?.extra?.remoteRegistryUrl;
    if (fromExtra) {
      return fromExtra;
    }
  } catch {
    // expo-constants not available (e.g. remote standalone)
  }

  return LOCAL_REGISTRY_URL;
}
