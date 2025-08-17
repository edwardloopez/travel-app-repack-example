import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { platformIOS } = require('@rnef/platform-ios');
const { platformAndroid } = require('@rnef/platform-android');
const { pluginRepack } = require('@rnef/plugin-repack');

export default {
  platforms: {
    ios: platformIOS(),
    android: platformAndroid(),
  },
  bundler: pluginRepack(),
};
