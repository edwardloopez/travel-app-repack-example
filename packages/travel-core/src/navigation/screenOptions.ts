import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const HOST_STACK_HEADER_COLOR = '#2196F3';

export const hostStackScreenOptions: NativeStackNavigationOptions = {
  headerTintColor: '#fff',
  headerBackButtonDisplayMode: 'minimal',
  headerStyle: {
    backgroundColor: HOST_STACK_HEADER_COLOR,
  },
};

export const microAppAccentColors = {
  weather: '#3498db',
  search: '#9C27B0',
} as const;

export function createMicroAppStackScreenOptions(
  accentColor: string
): NativeStackNavigationOptions {
  return {
    headerTintColor: '#fff',
    headerBackButtonDisplayMode: 'minimal',
    headerStyle: { backgroundColor: accentColor },
    headerTitleStyle: { fontWeight: '600' },
  };
}
