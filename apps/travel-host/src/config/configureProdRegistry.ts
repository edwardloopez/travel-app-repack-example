import Constants from 'expo-constants';
import { setRemoteRegistryUrl } from 'travel-core';

const fromExtra = Constants.expoConfig?.extra?.remoteRegistryUrl;

if (typeof fromExtra === 'string' && fromExtra.length > 0) {
  setRemoteRegistryUrl(fromExtra);
}
