import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelDestinations',
  loadModule: () => import('TravelDestinations/DestinationsScreen'),
  moduleName: 'DestinationsScreen',
  loadingLabel: 'Destinations',
  fallbackTitle: 'Destinations Service',
  fallbackIcon: '🏛️',
  startCommand: 'pnpm start:travel-destinations',
});
