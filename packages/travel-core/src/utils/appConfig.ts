import { LOCAL_REGISTRY_URL } from '../constants/remoteDefaults';

type AppConfig = {
  REMOTE_PROFILE?: string;
  HOST_IP_ADDRESS?: string;
};

const CONFIG_KEYS: (keyof AppConfig)[] = ['REMOTE_PROFILE', 'HOST_IP_ADDRESS'];

function readNativeConfig(): AppConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-config').default as AppConfig;
  } catch {
    return {};
  }
}

/** Single source for env vars: react-native-config first, then inlined process.env (rspack/babel). */
export function getConfigValue(key: keyof AppConfig): string | undefined {
  const fromNative = readNativeConfig()[key];
  if (fromNative) {
    return fromNative;
  }

  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }

  return undefined;
}

export function getAppConfig(): AppConfig {
  return CONFIG_KEYS.reduce((config, key) => {
    const value = getConfigValue(key);
    if (value) {
      config[key] = value;
    }
    return config;
  }, {} as AppConfig);
}

/** Registry URL for external profile: expo.extra first, then local default. */
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
