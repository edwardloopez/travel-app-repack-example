import { registerRemotes } from '@module-federation/runtime-tools/runtime';
import { getRemoteProfile, mfTrace, type RemoteRegistry } from 'travel-core';

let initialized = false;

export async function initDynamicRemotes(registry: RemoteRegistry) {
  if (initialized) {
    return;
  }

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

    mfTrace('2.registerRemotes.done', {
      count: remotes.length,
      entries: remotes.map(r => ({ name: r.name, entry: r.entry })),
    });
  } else {
    mfTrace('2.registerRemotes.skipped', {
      profile,
      reason: 'dev uses build-time remotes',
      entries: registry.remotes
        .filter(remote => remote.enabled)
        .map(remote => remote.entry),
    });
  }

  initialized = true;
}

export function resetDynamicRemotesForTests() {
  initialized = false;
}
