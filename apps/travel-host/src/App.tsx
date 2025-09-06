import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TravelProvider } from 'travel-core';
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
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <ThemeProvider>
        <TravelProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </TravelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
