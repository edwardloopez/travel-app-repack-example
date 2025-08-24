import * as Repack from '@callstack/repack';
import { ExpoModulesPlugin } from '@callstack/repack-plugin-expo-modules';
import rspack from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSharedDependencies } from 'travel-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Travel Host App - Module Federation Configuration
 */

export default async env => {
  const {
    mode,
    platform,
    hostIpAddress = process.env.HOST_IP_ADDRESS || 'localhost',
  } = env;

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
          TravelWeather: `TravelWeather@http://${hostIpAddress}:9000/${platform}/mf-manifest.json`,
          TravelDestinations: `TravelDestinations@http://${hostIpAddress}:9001/${platform}/mf-manifest.json`,
          TravelSearch: `TravelSearch@http://${hostIpAddress}:9002/${platform}/mf-manifest.json`,
          TravelPhotos: `TravelPhotos@http://${hostIpAddress}:9003/${platform}/mf-manifest.json`,
        },
        shared: getSharedDependencies({ eager: true }),
        runtimePlugins: ['./fetch-with-policy-plugin.ts'],
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
