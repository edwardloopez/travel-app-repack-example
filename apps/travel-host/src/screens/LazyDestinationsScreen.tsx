import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelDestinations',
  moduleName: 'DestinationsScreen',
  loadingLabel: 'Destinations',
  fallbackTitle: 'Destinations Service',
  fallbackIcon: '🏛️',
  startCommand: 'pnpm start:travel-destinations',
});
