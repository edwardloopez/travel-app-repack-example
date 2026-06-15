import { createRemoteRspackConfig } from 'travel-sdk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createRemoteRspackConfig({
  dirname: __dirname,
  appName: 'travel-photos',
  mfName: 'TravelPhotos',
  entry: './index.js',
  exposes: {
    './PhotosScreen': './src/PhotosScreen',
  },
});
