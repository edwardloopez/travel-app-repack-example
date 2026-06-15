import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelWeather',
  loadModule: () => import('TravelWeather/App'),
  moduleName: 'App',
  loadingLabel: 'Weather',
  fallbackTitle: 'Weather Service',
  fallbackIcon: '🌤️',
  startCommand: 'pnpm start:travel-weather',
});
