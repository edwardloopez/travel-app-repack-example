import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dependencies = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dependencies.json'), 'utf8')
) as Record<string, { version: string }>;

/**
 * Collect shared dependencies from the SDK and expose them
 * for the ModuleFederationPluginV2.
 *
 * `version` must be the **installed** semver (e.g. 7.1.17), not a range (^7.1.17).
 */
export default function getSharedDependencies({
  eager = true,
}: {
  eager?: boolean;
} = {}) {
  const hostRequire = createRequire(
    path.join(__dirname, '../../../apps/travel-host/package.json')
  );

  const shared = Object.entries(dependencies).map(([dep, { version }]) => {
    let installedVersion: string;

    try {
      installedVersion = hostRequire(`${dep}/package.json`).version;
    } catch {
      installedVersion = version.replace(/^[\^~>=<]+/, '');
    }

    return [
      dep,
      {
        singleton: true,
        eager,
        requiredVersion: installedVersion,
        version: installedVersion,
      },
    ] as const;
  });

  return Object.fromEntries(shared);
}
