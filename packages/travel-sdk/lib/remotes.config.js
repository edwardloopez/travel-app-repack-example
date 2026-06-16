/**
 * Single source of static remote metadata for registry generation.
 * Versions are read from each micro-app package.json at generate time.
 */
export const REMOTES_CONFIG = [
  {
    name: 'TravelWeather',
    slug: 'weather',
    devPort: 9000,
    exposes: ['./App'],
    title: 'Weather',
    description: 'Check weather for your destinations',
    screen: 'Weather',
    color: '#4CAF50',
    icon: '☁️',
  },
  {
    name: 'TravelDestinations',
    slug: 'destinations',
    devPort: 9001,
    exposes: ['./DestinationsScreen'],
    title: 'Destinations',
    description: 'Explore amazing destinations worldwide',
    screen: 'Destinations',
    color: '#FF9800',
    icon: '🌍',
  },
  {
    name: 'TravelSearch',
    slug: 'search',
    devPort: 9002,
    exposes: ['./App'],
    title: 'Search',
    description: 'Find flights and hotels',
    screen: 'Search',
    color: '#9C27B0',
    icon: '✈️',
  },
  {
    name: 'TravelPhotos',
    slug: 'photos',
    devPort: 9003,
    exposes: ['./PhotosScreen'],
    title: 'Photos',
    description: 'Beautiful travel photography',
    screen: 'Photos',
    color: '#E91E63',
    icon: '📸',
  },
];

export const REMOTE_NAMES = REMOTES_CONFIG.map(remote => remote.name);
