import { ExpoModulesPlugin } from '@callstack/repack-plugin-expo-modules';
import { createHostRspackConfig } from 'travel-sdk/lib/createRspackConfig.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

export default createHostRspackConfig({
  dirname: __dirname,
  entry: './index.ts',
  runtimePlugins: ['./mf-fetch-plugin.ts'],
  extraPlugins: [new ExpoModulesPlugin()],
});
