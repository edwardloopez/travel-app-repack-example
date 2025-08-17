import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HomeScreen from '../screens/HomeScreen';
import LazyDestinationsScreen from '../screens/LazyDestinationsScreen';
import LazyPhotosScreen from '../screens/LazyPhotosScreen';
import LazySearchScreen from '../screens/LazySearchScreen';
import LazyWeatherScreen from '../screens/LazyWeatherScreen';

export type RootStackParamList = {
  Home: undefined;
  Weather: undefined;
  Destinations: undefined;
  Search: undefined;
  Photos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#2196F3',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Travel App' }}
      />
      <Stack.Screen
        name="Weather"
        component={LazyWeatherScreen}
        options={{ title: 'Weather' }}
      />
      <Stack.Screen
        name="Destinations"
        component={LazyDestinationsScreen}
        options={{ title: 'Destinations' }}
      />
      <Stack.Screen
        name="Search"
        component={LazySearchScreen}
        options={{ title: 'Search Flights & Hotels' }}
      />
      <Stack.Screen
        name="Photos"
        component={LazyPhotosScreen}
        options={{ title: 'Travel Photos' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
