import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelSearch',
  moduleName: 'SearchScreen',
  loadingLabel: 'Search',
  fallbackTitle: 'Search Service',
  fallbackIcon: '🔍',
  startCommand: 'pnpm start:travel-search',
});
