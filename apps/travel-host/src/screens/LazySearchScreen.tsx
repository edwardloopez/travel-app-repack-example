import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelSearch',
  loadModule: () => import('TravelSearch/SearchScreen'),
  moduleName: 'SearchScreen',
  loadingLabel: 'Search',
  fallbackTitle: 'Search Service',
  fallbackIcon: '🔍',
  startCommand: 'pnpm start:travel-search',
});
