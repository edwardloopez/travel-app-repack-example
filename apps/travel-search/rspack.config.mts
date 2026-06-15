import { createRemoteRspackConfig } from 'travel-sdk/lib/createRspackConfig.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createRemoteRspackConfig({
  dirname: __dirname,
  appName: 'travel-search',
  mfName: 'TravelSearch',
  entry: './index.js',
  exposes: {
    './App': './src/navigation/MainNavigator',
  },
});
