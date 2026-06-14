import { LOCAL_REGISTRY_URL } from '../constants/remoteDefaults';

let remoteRegistryUrlOverride: string | undefined;

/** Host calls this at startup (e.g. from expo-constants). Remotes skip it. */
export function setRemoteRegistryUrl(url: string | undefined): void {
  remoteRegistryUrlOverride = url;
}

export function getRemoteRegistryUrl(): string {
  return remoteRegistryUrlOverride ?? LOCAL_REGISTRY_URL;
}
