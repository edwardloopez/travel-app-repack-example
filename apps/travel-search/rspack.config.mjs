import * as Repack from '@callstack/repack';
import rspack from '@rspack/core';
import { getSharedDependencies } from 'travel-sdk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withZephyr } from 'zephyr-repack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USE_ZEPHYR = Boolean(process.env.ZC);

/**
 * TravelSearch App - Module Federation Remote Configuration
 */

const config = Repack.defineRspackConfig(({ mode, platform }) => {
  return {
    mode,
    context: __dirname,
    entry: './index.js',
    resolve: {
      ...Repack.getResolveOptions(),
      modules: [
        'node_modules',
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../node_modules'),
      ],
      alias: {
        '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
      },
    },
    output: {
      uniqueName: 'travel-search',
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          use: {
            loader: '@callstack/repack/babel-loader',
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
        name: 'TravelSearch',
        filename: 'TravelSearch.container.js.bundle',
        dts: false,
        exposes: {
          './SearchScreen': './src/SearchScreen',
        },
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
  };
});

export default USE_ZEPHYR ? withZephyr()(config) : config;
