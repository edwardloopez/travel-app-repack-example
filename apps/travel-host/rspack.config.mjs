import * as Repack from '@callstack/repack';
import { ExpoModulesPlugin } from '@callstack/repack-plugin-expo-modules';
import rspack from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSharedDependencies } from 'travel-sdk';
import { withZephyr } from 'zephyr-repack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USE_ZEPHYR = Boolean(process.env.ZC);

/**
 * Travel Host App - Module Federation Configuration
 */

const config = env => {
  const { mode, platform } = env;
  return {
    mode,
    context: __dirname,
    entry: './index.ts',
    resolve: {
      ...Repack.getResolveOptions(),
    },
    output: {
      uniqueName: 'travel-host',
    },
    module: {
      rules: [
        ...Repack.getJsTransformRules(),
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
      new ExpoModulesPlugin(),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'TravelHost',
        dts: false,
        remotes: {
          TravelWeather: `TravelWeather@http://localhost:9000/${platform}/mf-manifest.json`,
          TravelDestinations: `TravelDestinations@http://localhost:9001/${platform}/mf-manifest.json`, 
          TravelSearch: `TravelSearch@http://localhost:9002/${platform}/mf-manifest.json`,
          TravelPhotos: `TravelPhotos@http://localhost:9003/${platform}/mf-manifest.json`,
        },
        shared: getSharedDependencies({ eager: true }),
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
