import React, { useEffect } from 'react';
import { ScriptManager } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupTravelScriptResolver } from '../utils/scriptManagerResolver';
import { mfTrace } from '../utils/mfTrace';
import {
  isScriptManagerCacheKey,
  notifyBundleCacheChanged,
} from '../utils/bundleCacheManager';

interface BundleCacheProviderProps {
  children: React.ReactNode;
}

const scriptManagerStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
    if (isScriptManagerCacheKey(key)) {
      notifyBundleCacheChanged();
    }
  },
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

/**
 * Wires ScriptManager to AsyncStorage for cache metadata (bundles live on native FS).
 */
const BundleCacheProvider: React.FC<BundleCacheProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    setupTravelScriptResolver();
    ScriptManager.shared.setStorage(scriptManagerStorage);

    console.log('BundleCache: Initialized ScriptManager storage');
    mfTrace('5.storage.initialized', {
      cacheEnabled: !__DEV__,
      message: 'ScriptManager AsyncStorage passthrough',
    });
  }, []);

  return <>{children}</>;
};

export { BundleCacheProvider };
