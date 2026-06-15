import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRemoteRegistry } from '../context/RemoteRegistryContext';
import { BundleCacheManager, useBundleCache } from '../utils/bundleCacheManager';
import { applyRemoteConfig } from '../utils/bundleVersioning';
import { getRemoteProfile } from '../utils/remoteRegistry';
import type { RemoteRegistry } from '../utils/remoteRegistry';
import { mfTrace } from '../utils/mfTrace';
import { isRemoteManifestReachable } from '../utils/remoteReachability';

export interface BootstrapStatus {
  isBootstrapping: boolean;
  isReady: boolean;
  profile: string;
  updatedRemotes: string[];
  preloadedRemotes: string[];
  error?: string;
}

const PRELOAD_REMOTES = ['TravelWeather', 'TravelSearch'];

export function useRemoteBootstrap(
  initDynamicRemotes?: (registry: RemoteRegistry) => Promise<void>
) {
  const { refreshRegistry, isReady } = useRemoteRegistry();
  const { checkForUpdates, preloadBundles } = useBundleCache();
  const [status, setStatus] = useState<BootstrapStatus>({
    isBootstrapping: true,
    isReady: false,
    profile: 'dev',
    updatedRemotes: [],
    preloadedRemotes: [],
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const bootStartedAt = Date.now();
      mfTrace('0.bootstrap.start', {
        profile: getRemoteProfile(),
        platform: Platform.OS,
      });
      try {
        const registry = await refreshRegistry();
        const config = applyRemoteConfig(registry);

        if (initDynamicRemotes) {
          await initDynamicRemotes(registry);
        }

        const updatedRemotes = await checkForUpdates(config);
        if (updatedRemotes.length > 0) {
          mfTrace('3.cache.invalidated', { remotes: updatedRemotes });
        } else {
          mfTrace('3.cache.checkForUpdates.ok', { message: 'no invalidations' });
        }

        const profile = registry.profile || getRemoteProfile();
        const enabledRemoteNames = registry.remotes
          .filter(remote => remote.enabled)
          .map(remote => remote.name);
        const preloadTargets = PRELOAD_REMOTES.filter(name =>
          enabledRemoteNames.includes(name)
        );

        // Prefetch uses ScriptManager natively — only when CDN is up and bundles
        // are not already offline-ready (avoids native crashes when serve is down).
        if (profile !== 'dev' && preloadTargets.length > 0) {
          const platform = Platform.OS;
          const cdnReachable = await isRemoteManifestReachable(
            preloadTargets[0],
            platform
          );

          if (!cdnReachable) {
            mfTrace('4.prefetch.skipped', {
              profile,
              reason: 'cdn unreachable',
              targets: preloadTargets,
            });
          } else {
            const targetsNeedingPrefetch: string[] = [];
            for (const remoteName of preloadTargets) {
              if (await BundleCacheManager.canLoadOffline(remoteName, platform)) {
                mfTrace('4.prefetch.skipRemote', {
                  remoteName,
                  reason: 'already offline-ready',
                });
                continue;
              }
              targetsNeedingPrefetch.push(remoteName);
            }

            if (targetsNeedingPrefetch.length === 0) {
              mfTrace('4.prefetch.skipped', {
                profile,
                reason: 'all targets offline-ready',
                targets: preloadTargets,
              });
            } else {
              mfTrace('4.prefetch.start', { targets: targetsNeedingPrefetch });
              await preloadBundles(targetsNeedingPrefetch, platform, config);
              mfTrace('4.prefetch.done', { targets: targetsNeedingPrefetch });
            }
          }
        } else {
          mfTrace('4.prefetch.skipped', { profile, reason: 'dev or no targets' });
        }

        if (!cancelled) {
          mfTrace('0.bootstrap.done', {
            durationMs: Date.now() - bootStartedAt,
            profile,
            preloadedRemotes: profile !== 'dev' ? preloadTargets : [],
          });
          setStatus({
            isBootstrapping: false,
            isReady: true,
            profile,
            updatedRemotes,
            preloadedRemotes: profile !== 'dev' ? preloadTargets : [],
          });
        }
      } catch (error) {
        mfTrace('0.bootstrap.error', {
          durationMs: Date.now() - bootStartedAt,
          error: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) {
          setStatus({
            isBootstrapping: false,
            isReady,
            profile: 'dev',
            updatedRemotes: [],
            preloadedRemotes: [],
            error: error instanceof Error ? error.message : 'Bootstrap failed',
          });
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
    // Bootstrap once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
