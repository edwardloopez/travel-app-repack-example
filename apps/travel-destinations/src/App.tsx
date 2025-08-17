import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TravelProvider, ThemeProvider } from 'travel-core';
import DestinationsScreen from './DestinationsScreen';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TravelProvider>
          <DestinationsScreen />
        </TravelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
