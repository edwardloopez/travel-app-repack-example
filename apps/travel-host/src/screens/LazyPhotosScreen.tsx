import { createLazyFederatedScreen } from '../federation/createLazyFederatedScreen';

export default createLazyFederatedScreen({
  remoteName: 'TravelPhotos',
  moduleName: 'PhotosScreen',
  loadingLabel: 'Photos',
  fallbackTitle: 'Photos Service',
  fallbackIcon: '📸',
  startCommand: 'pnpm start:travel-photos',
});
