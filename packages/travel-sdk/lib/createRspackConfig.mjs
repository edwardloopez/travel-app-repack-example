import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';
import { createRequire } from 'node:module';
import path from 'node:path';
import getSharedDependencies from './sharedDeps.js';
import { buildHostRemotes } from './remoteProfiles.mjs';

function createHostResolveAliases(dirname) {
  const hostRequire = createRequire(path.join(dirname, 'package.json'));

  return {
    '@module-federation/enhanced/runtime': hostRequire.resolve(
      '@module-federation/enhanced/runtime'
    ),
    '@module-federation/runtime-tools/runtime': hostRequire.resolve(
      '@module-federation/runtime-tools/runtime'
    ),
  };
}

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
      ...Repack.getResolveOptions(),
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
        // Per-platform URLs (ios/android) from rspack env — not a runtime placeholder.
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
  const config = Repack.defineRspackConfig(({ mode }) => ({
    mode,
    context: dirname,
    entry,
    resolve: {
      ...Repack.getResolveOptions(),
      modules: [
        'node_modules',
        path.resolve(dirname, 'node_modules'),
        path.resolve(dirname, '../../node_modules'),
      ],
      alias: {
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
    ],
  }));

  return config;
}
