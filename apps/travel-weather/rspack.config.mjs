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
 * TravelWeather App - Module Federation Remote Configuration
 */

const config = env => {
  const { mode, platform } = env;
  return {
    mode,
    context: __dirname,
    entry: './index.js',
    resolve: {
      ...Repack.getResolveOptions(),
    },
    output: {
      uniqueName: 'travel-weather',
    },
    module: {
      rules: [
        ...Repack.getJsTransformRules(),
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'TravelWeather',
        filename: 'TravelWeather.container.js.bundle',
        dts: false,
        exposes: {
          './WeatherScreen': './src/WeatherScreen',
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
};

export default USE_ZEPHYR ? withZephyr()(config) : config;
