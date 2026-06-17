const { withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const BEGIN_MARKER = '# @generated begin fmt-xcode26-cpp17';
const END_MARKER = '# @generated end fmt-xcode26-cpp17';

const FMT_CPP17_SNIPPET = `    ${BEGIN_MARKER} — withFmtXcode26Cpp17
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'

      target.build_configurations.each do |config|
        # fmt 11.x + Xcode 26: compilar en C++17 desactiva FMT_USE_CONSTEVAL
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
    ${END_MARKER}
`;

/**
 * Forces the fmt pod to compile as C++17 so RN 0.80's fmt 11.x builds on Xcode 26+.
 */
function withFmtXcode26Cpp17(config) {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = await fs.promises.readFile(podfilePath, 'utf8');

      if (contents.includes(BEGIN_MARKER)) {
        return config;
      }

      const anchor =
        '    # This is necessary for Xcode 14, because it signs resource bundles by default';

      if (contents.includes(anchor)) {
        contents = contents.replace(anchor, `${FMT_CPP17_SNIPPET}\n${anchor}`);
      } else {
        throw new Error(
          'withFmtXcode26Cpp17: could not find Podfile post_install anchor to inject fmt C++17 fix.'
        );
      }

      await fs.promises.writeFile(podfilePath, contents);
      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(withFmtXcode26Cpp17, 'withFmtXcode26Cpp17', '1.0.0');
