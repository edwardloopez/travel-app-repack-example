import type { FederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const extractNameFromUrl = (url: string) => {
  const match = url.match(/\/([^/]+)\/manifest\.json$/);
  return match ? match[1] : '';
};

const extractVersionFromUrl = (url: string) => {
  const match = url.match(/\/([^/]+)\/([^/]+)\/manifest\.json$/);
  return match ? match[2] : '';
};

export default function (): FederationRuntimePlugin {
  if (__DEV__) {
    return {
      name: 'fetch-manifest-with-credentials-plugin',
      async fetch(url: string, options: RequestInit) {
        console.log('Development mode: Fetching without auth', {
          url,
          options,
        });
        const response = await fetch(url, {
          ...options,
        });
        return response;
      },
    };
  }

  return {
    name: 'fetch-manifest-with-credentials-plugin',
    async fetch(url: string, options: RequestInit) {
      const AsyncStorage = (
        await import('@react-native-async-storage/async-storage')
      ).default;

      const config = (await import('react-native-config')).default;

      const manifestName = extractNameFromUrl(url);
      const manifestVersion = extractVersionFromUrl(url);

      try {
        const cachedVersion = await AsyncStorage.getItem(
          `manifest:${manifestName}:${manifestVersion}`
        );
        if (cachedVersion === manifestVersion) {
          throw new Error('Use cached manifest');
        }

        const token = await getToken({ domainName: manifestName });

        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch manifest');
        }

        const manifest = await response.json();
        await AsyncStorage.setItem(
          `manifest:${manifestName}:${manifestVersion}`,
          JSON.stringify(manifest)
        );

        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error fetching manifest:', error);
        throw error;
      }
    },
    async errorLoadRemote(args) {
      console.error('Error loading remote module:', args);
      const AsyncStorage = (
        await import('@react-native-async-storage/async-storage')
      ).default;

      const config = (await import('react-native-config')).default;

      if (args.lifecycle == 'afterResolve') {
        console.log('Using cached manifest:', args.id);

        const manifestName = extractNameFromUrl(args.id);
        const manifestVersion = extractVersionFromUrl(args.id);

        if (manifestName && manifestVersion) {
          const cachedManifest = await AsyncStorage.getItem(
            `manifest:${manifestName}:${manifestVersion}`
          );
          if (cachedManifest) {
            console.log('Found cached manifest:', cachedManifest);
            return JSON.parse(cachedManifest);
          }
        }

        const ErrorBoundary = await import(
          '../../packages/travel-core/src/components/ErrorBoundary'
        );

        return () => ({
          _esModule: true,
          default: ErrorBoundary,
        });
      }
    },
  };
}

const getToken = async ({ domainName }: { domainName: string }) => {
  // const microApp = findDomain(domainName);

  // if (!microApp) {
  //     throw new Error("Micro app not found");
  // }

  const AsyncStorage = (
    await import('@react-native-async-storage/async-storage')
  ).default;

  const config = (await import('react-native-config')).default;

  const cachedToken = await AsyncStorage.getItem(`token:${domainName}`);
  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch(`${config.AUTH_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domainName }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch token');
  }

  const { token } = await response.json();
  await AsyncStorage.setItem(`token:${domainName}`, token);
  return token;
};

// const findDomain = (domainName: string) => {
//     return microApps.find(app => app.domainName === domainName);
// };
