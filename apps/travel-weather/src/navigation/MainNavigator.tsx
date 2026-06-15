import React from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import WeatherScreen from '../WeatherScreen';
import { LazyScreen } from '../components/LazyScreen';

const WeatherForecastScreen = React.lazy(
  () => import('../screens/WeatherForecastScreen')
);

export type WeatherStackParamList = {
  WeatherHome: undefined;
  WeatherForecast: { city: string };
};

const Stack = createNativeStackNavigator<WeatherStackParamList>();

type ForecastProps = NativeStackScreenProps<
  WeatherStackParamList,
  'WeatherForecast'
>;

type HomeProps = NativeStackScreenProps<WeatherStackParamList, 'WeatherHome'>;

const ForecastScreen = (props: ForecastProps) => (
  <LazyScreen>
    <WeatherForecastScreen {...props} />
  </LazyScreen>
);

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3498db' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="WeatherHome"
        component={WeatherScreen}
        options={({ navigation }: HomeProps) => ({
          title: 'Weather',
          headerLeft: ({ canGoBack: _canGoBack, ...headerProps }) => {
            const parent = navigation.getParent();
            if (!parent?.canGoBack()) {
              return null;
            }
            return (
              <HeaderBackButton
                {...headerProps}
                onPress={() => parent.goBack()}
              />
            );
          },
        })}
      />
      <Stack.Screen
        name="WeatherForecast"
        component={ForecastScreen}
        options={{ title: '5-Day Forecast' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
