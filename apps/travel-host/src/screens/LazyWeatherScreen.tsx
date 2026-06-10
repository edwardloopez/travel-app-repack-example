import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelWeather',
  moduleName: 'WeatherScreen',
  loadingLabel: 'Weather',
  fallbackTitle: 'Weather Service',
  fallbackIcon: '🌤️',
  startCommand: 'pnpm start:travel-weather',
});
