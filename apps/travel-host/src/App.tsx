import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BundleCacheProvider,
  RemoteRegistryProvider,
  ThemeProvider,
  TravelProvider,
} from 'travel-core';
import RemoteBootstrapGate from './components/RemoteBootstrapGate';
import MainNavigator from './navigation/MainNavigator';

if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
  };
}

const App = () => {
  LogBox.ignoreAllLogs(true);

  LogBox.ignoreLogs([
    'Federation Runtime',
    'remoteEntryExports is undefined',
    'Failed to load remote entry',
    'ScriptManager',
    'ScriptDownloadFailure',
  ]);

  return (
    <BundleCacheProvider>
      <RemoteRegistryProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" />
          <ThemeProvider>
            <TravelProvider>
              <RemoteBootstrapGate>
                <NavigationContainer>
                  <MainNavigator />
                </NavigationContainer>
              </RemoteBootstrapGate>
            </TravelProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </RemoteRegistryProvider>
    </BundleCacheProvider>
  );
};

export default App;
