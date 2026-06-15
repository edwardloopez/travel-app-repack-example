import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TravelProvider, ThemeProvider } from 'travel-core';
import MainNavigator from './navigation/MainNavigator';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
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
