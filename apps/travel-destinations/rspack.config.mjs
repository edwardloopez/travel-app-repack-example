import { createRemoteRspackConfig } from 'travel-sdk/lib/createRspackConfig.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createRemoteRspackConfig({
  dirname: __dirname,
  appName: 'travel-destinations',
  mfName: 'TravelDestinations',
  entry: './index.js',
  exposes: {
    './DestinationsScreen': './src/DestinationsScreen',
  },
});
