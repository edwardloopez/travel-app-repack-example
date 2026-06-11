import { registerRemotes } from '@module-federation/runtime-tools/runtime';
import { getRemoteProfile, loadRemoteRegistry } from 'travel-core';

let initialized = false;

export async function initDynamicRemotes(platform: string) {
  if (initialized) {
    return;
  }

  const registry = await loadRemoteRegistry(platform);
  const profile = getRemoteProfile();

  // Dev remotes are declared at build time in rspack (buildHostRemotes).
  // Re-registering here breaks RepackResolverPlugin (missing referenceUrl).
  if (profile === 'prod') {
    const remotes = registry.remotes
      .filter(remote => remote.enabled)
      .map(remote => ({
        name: remote.name,
        entry: remote.entry,
        alias: remote.name,
      }));

    registerRemotes(remotes, { force: true });

    console.log(
      `MF Runtime: Registered ${remotes.length} remotes (${profile})`,
      remotes.map(remote => remote.entry)
    );
  } else {
    console.log(
      `MF Runtime: Using build-time remotes (${profile})`,
      registry.remotes.filter(remote => remote.enabled).map(remote => remote.entry)
    );
  }

  initialized = true;
}

export function resetDynamicRemotesForTests() {
  initialized = false;
}
