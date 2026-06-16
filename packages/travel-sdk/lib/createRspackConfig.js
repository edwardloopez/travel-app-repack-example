import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';
import { createRequire } from 'node:module';
import path from 'node:path';
import getSharedDependencies from './sharedDeps.js';
import { buildHostRemotes } from './remoteProfiles.js';
import { HOST_APP_DIR } from './paths.js';

/**
 * Packages that must resolve to one physical install (pnpm can duplicate them otherwise).
 * */
const SINGLETON_RESOLVE_PACKAGES = [
  'react',
  'react-native',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/elements',
  'react-native-safe-area-context',
  'react-native-screens',
];

function createSingletonResolveAliases(dirname) {
  const hostRequire = createRequire(path.join(HOST_APP_DIR, 'package.json'));
  const appRequire = createRequire(path.join(dirname, 'package.json'));
  const aliases = {};

  const resolvePkgRoot = pkg => {
    try {
      return path.dirname(appRequire.resolve(`${pkg}/package.json`));
    } catch {
      return path.dirname(hostRequire.resolve(`${pkg}/package.json`));
    }
  };

  for (const pkg of SINGLETON_RESOLVE_PACKAGES) {
    try {
      aliases[pkg] = resolvePkgRoot(pkg);
    } catch {
      // Optional in some mini-apps.
    }
  }

  for (const subpath of ['jsx-runtime', 'jsx-dev-runtime']) {
    try {
      aliases[`react/${subpath}`] = appRequire.resolve(`react/${subpath}`);
    } catch {
      try {
        aliases[`react/${subpath}`] = hostRequire.resolve(`react/${subpath}`);
      } catch {
        // ignore
      }
    }
  }

  return aliases;
}

function createTravelResolveAliases(dirname) {
  const repoRoot = path.resolve(dirname, '../..');

  return {
    'travel-sdk/lib/remotesCatalog.json': path.join(
      repoRoot,
      'packages/travel-sdk/lib/remotesCatalog.json'
    ),
  };
}

function createHostResolveAliases(dirname) {
  const hostRequire = createRequire(path.join(dirname, 'package.json'));

  return {
    ...createSingletonResolveAliases(dirname),
    ...createTravelResolveAliases(dirname),
    '@module-federation/enhanced/runtime': hostRequire.resolve(
      '@module-federation/enhanced/runtime'
    ),
    '@module-federation/runtime': hostRequire.resolve('@module-federation/runtime'),
  };
}

/**
 * @param {{
 *   dirname: string;
 *   entry: string;
 *   runtimePlugins?: string[];
 *   extraPlugins?: import('@rspack/core').RspackPlugin[];
 * }} options
 */
export function createHostRspackConfig({
  dirname,
  entry,
  runtimePlugins = [],
  extraPlugins = [],
}) {
  const config = Repack.defineRspackConfig(({ mode, platform }) => ({
    mode,
    context: dirname,
    entry,
    devServer: {
      proxy: [
        {
          context: ['/.expo/.virtual-metro-entry'],
          target: 'http://localhost:8081',
          pathRewrite: { '^/.expo/.virtual-metro-entry': '/index' },
          changeOrigin: true,
        },
      ],
    },
    resolve: {
      ...Repack.getResolveOptions({ enablePackageExports: true }),
      modules: [
        'node_modules',
        path.resolve(dirname, 'node_modules'),
        path.resolve(dirname, '../../node_modules'),
      ],
      alias: createHostResolveAliases(dirname),
    },
    output: {
      uniqueName: 'travel-host',
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          use: {
            loader: '@callstack/repack/babel-swc-loader',
            parallel: true,
            options: {},
          },
          type: 'javascript/auto',
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
      ...extraPlugins,
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'TravelHost',
        dts: false,
        remotes: buildHostRemotes(undefined, platform),
        shared: getSharedDependencies({ eager: true }),
        runtimePlugins,
      }),
      new rspack.IgnorePlugin({
        resourceRegExp: /^@react-native-masked-view/,
      }),
      new Repack.plugins.HermesBytecodePlugin({
        enabled: mode === 'production',
        test: /\.(js)?bundle$/,
        exclude: /index.bundle$/,
      }),
    ],
  }));

  return config;
}

export function createRemoteRspackConfig({
  dirname,
  appName,
  mfName,
  entry,
  exposes,
}) {
  const repoRoot = path.resolve(dirname, '../..');
  const codeSigningKeyPath = path.join(repoRoot, 'code-signing.pem');

  const config = Repack.defineRspackConfig(({ mode }) => ({
    mode,
    context: dirname,
    entry,
    resolve: {
      ...Repack.getResolveOptions({ enablePackageExports: true }),
      modules: [
        'node_modules',
        path.resolve(dirname, 'node_modules'),
        path.resolve(dirname, '../../node_modules'),
      ],
      alias: {
        ...createSingletonResolveAliases(dirname),
        ...createTravelResolveAliases(dirname),
        '@babel/runtime': path.resolve(dirname, 'node_modules/@babel/runtime'),
      },
    },
    output: {
      uniqueName: appName,
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          use: {
            loader: '@callstack/repack/babel-swc-loader',
            parallel: true,
            options: {},
          },
          type: 'javascript/auto',
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
      new Repack.plugins.ModuleFederationPluginV2({
        name: mfName,
        filename: `${mfName}.container.js.bundle`,
        dts: false,
        exposes,
        shared: getSharedDependencies({ eager: false }),
      }),
      new rspack.IgnorePlugin({
        resourceRegExp: /^@react-native-masked-view/,
      }),
      new Repack.plugins.HermesBytecodePlugin({
        enabled: mode === 'production',
        test: /\.(js)?bundle$/,
        exclude: /index.bundle$/,
      }),
      new Repack.plugins.CodeSigningPlugin({
        enabled: mode === 'production',
        privateKeyPath: codeSigningKeyPath,
      }),
    ],
  }));

  return config;
}
