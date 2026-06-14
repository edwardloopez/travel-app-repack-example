// Shared context providers
export { ThemeProvider, useTheme } from './context/ThemeContext';
export { TravelProvider, useTravelContext } from './context/TravelContext';
export {
  RemoteRegistryProvider,
  useRemoteRegistry,
} from './context/RemoteRegistryContext';

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
export * from './utils/remoteRegistry';
export { setRemoteRegistryUrl } from './utils/appConfig';
export { BundleCacheManager, useBundleCache } from './utils/bundleCacheManager';
export { mfTrace, MF_TRACE_ENABLED } from './utils/mfTrace';
export { useRemoteBootstrap } from './hooks/useRemoteBootstrap';
export type { BootstrapStatus } from './hooks/useRemoteBootstrap';

// Shared types
export type { Destination, FlightResult, HotelResult, Weather } from './types';
