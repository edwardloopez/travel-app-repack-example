import type { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TravelHost',
  slug: 'travel-host',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.travelhost',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.anonymous.travelhost',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [],
  extra: {
    // Production external profile: set the CDN registry URL here.
    // remoteRegistryUrl: 'https://cdn.tuempresa.com/remote-registry.json',
  },
});
