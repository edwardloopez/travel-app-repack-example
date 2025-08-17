// Shared context providers
export { ThemeProvider, useTheme } from './context/ThemeContext';
export { TravelProvider, useTravelContext } from './context/TravelContext';

// Shared components
export { ErrorBoundary } from './components/ErrorBoundary';
export { FederationErrorFallback } from './components/FederationErrorFallback';
export { LoadingSpinner } from './components/LoadingSpinner';
export { SearchBar } from './components/SearchBar';
export { BundleCacheProvider } from './components/BundleCacheProvider';

// Shared utilities
export { createAPIClient } from './utils/apiClient';
export { formatCurrency } from './utils/formatters';
export * from './utils/bundleVersioning';
export { BundleCacheManager, useBundleCache } from './utils/bundleCacheManager';

// Shared types
export type { Destination, FlightResult, HotelResult, Weather } from './types';
