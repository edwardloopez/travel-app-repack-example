import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelPhotos',
  loadModule: () => import('TravelPhotos/PhotosScreen'),
  moduleName: 'PhotosScreen',
  loadingLabel: 'Photos',
  fallbackTitle: 'Photos Service',
  fallbackIcon: '📸',
  startCommand: 'pnpm start:travel-photos',
  readyStackOptions: { headerShown: true, title: 'Travel Photos' },
});
