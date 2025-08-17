import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TravelProvider, ThemeProvider } from 'travel-core';
import WeatherScreen from './WeatherScreen';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TravelProvider>
          <WeatherScreen />
        </TravelProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
