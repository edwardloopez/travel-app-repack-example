import { LOCAL_REGISTRY_URL } from '../constants/remoteDefaults';

let remoteRegistryUrlOverride: string | undefined;

const LOCAL_STATIC_REGISTRY_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '10.0.2.2',
]);

/** Host calls this at startup (e.g. from expo-constants). Remotes skip it. */
export function setRemoteRegistryUrl(url: string | undefined): void {
  remoteRegistryUrlOverride = url;
}

export function getRemoteRegistryUrl(): string {
  return remoteRegistryUrlOverride ?? LOCAL_REGISTRY_URL;
}

/**
 * True when the registry points at local serve:remotes 
 * (unsigned POC bundles).
 * */
export function isLocalStaticRegistryUrl(
  url: string = getRemoteRegistryUrl()
): boolean {
  try {
    const match = url.match(/^https?:\/\/([^/:]+)/);
    return match != null && LOCAL_STATIC_REGISTRY_HOSTS.has(match[1]);
  } catch {
    return false;
  }
}

/**
 * Unsigned local CDN bundles cannot pass Re.Pack strict 
 * signature checks.
 * */
export function getScriptSignatureVerificationMode(): 'off' | 'strict' {
  if (__DEV__ || isLocalStaticRegistryUrl()) {
    return 'off';
  }
  return 'strict';
}
