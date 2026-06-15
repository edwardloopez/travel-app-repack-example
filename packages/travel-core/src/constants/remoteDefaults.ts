/** Local remotes server port — keep in sync with packages/travel-sdk/lib/remoteDefaults.ts */
export const LOCAL_REMOTES_PORT = 4100;
/** Dev MF bundler host — simulator uses localhost */
export const DEV_MF_HOST = 'localhost';
export const LOCAL_STATIC_BASE_URL = `http://localhost:${LOCAL_REMOTES_PORT}`;
export const LOCAL_REGISTRY_URL = `${LOCAL_STATIC_BASE_URL}/remote-registry.json`;
