type AppConfig = {
  REMOTE_PROFILE?: string;
  HOST_IP_ADDRESS?: string;
  REMOTE_STATIC_BASE_URL?: string;
  REMOTE_REGISTRY_URL?: string;
};

const CONFIG_KEYS: (keyof AppConfig)[] = [
  'REMOTE_PROFILE',
  'HOST_IP_ADDRESS',
  'REMOTE_STATIC_BASE_URL',
  'REMOTE_REGISTRY_URL',
];

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
