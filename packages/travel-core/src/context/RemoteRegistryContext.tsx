import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  getEnabledFeatures,
  loadRemoteRegistry,
  type RemoteRegistry,
} from '../utils/remoteRegistry';

interface RemoteRegistryContextValue {
  registry: RemoteRegistry | null;
  isReady: boolean;
  enabledFeatures: ReturnType<typeof getEnabledFeatures>;
  applyRegistry: (registry: RemoteRegistry) => void;
  refreshRegistry: () => Promise<RemoteRegistry>;
}

const RemoteRegistryContext = createContext<
  RemoteRegistryContextValue | undefined
>(undefined);

export const RemoteRegistryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [registry, setRegistry] = useState<RemoteRegistry | null>(null);
  const [isReady, setIsReady] = useState(false);

  const applyRegistry = (nextRegistry: RemoteRegistry) => {
    setRegistry(nextRegistry);
    setIsReady(true);
  };

  const refreshRegistry = async () => {
    const nextRegistry = await loadRemoteRegistry();
    applyRegistry(nextRegistry);
    return nextRegistry;
  };

  const enabledFeatures = useMemo(
    () => (registry ? getEnabledFeatures(registry) : []),
    [registry]
  );

  return (
    <RemoteRegistryContext.Provider
      value={{
        registry,
        isReady,
        enabledFeatures,
        applyRegistry,
        refreshRegistry,
      }}
    >
      {children}
    </RemoteRegistryContext.Provider>
  );
};

export const useRemoteRegistry = () => {
  const context = useContext(RemoteRegistryContext);
  if (!context) {
    throw new Error('useRemoteRegistry must be used within RemoteRegistryProvider');
  }
  return context;
};
