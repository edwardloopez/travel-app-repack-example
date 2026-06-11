import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelWeather',
  loadModule: () => import('TravelWeather/WeatherScreen'),
  moduleName: 'WeatherScreen',
  loadingLabel: 'Weather',
  fallbackTitle: 'Weather Service',
  fallbackIcon: '🌤️',
  startCommand: 'pnpm start:travel-weather',
});
