const { createRequire } = require('module');
const path = require('path');

/**
 * Collect shared dependencies from the SDK and expose them
 * for the ModuleFederationPluginV2.
 *
 * `version` must be the **installed** semver (e.g. 7.1.17), not a range (^7.1.17).
 * Using a range as `version` makes MF fail singleton checks and loads duplicate
 * copies of @react-navigation — nested navigators then lose parent context (no back).
 *
 * @param {{ eager: boolean }} options Options for the shared dependencies. Use eager: false if using in a mini-app.
 * @returns Shared dependencies object.
 */
const getSharedDependencies = ({ eager = true }) => {
  const dependencies = require('./dependencies.json');
  const hostRequire = createRequire(
    path.join(__dirname, '../../../apps/travel-host/package.json')
  );

  const shared = Object.entries(dependencies).map(([dep, { version }]) => {
    let installedVersion;

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
    ];
  });

  return Object.fromEntries(shared);
};

module.exports = getSharedDependencies;
