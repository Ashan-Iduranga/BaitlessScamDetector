// Builds one release APK per CPU type instead of one 165 MB APK with all four.
//
//   app-arm64-v8a-release.apk     almost every phone since about 2017  (share this one)
//   app-armeabi-v7a-release.apk   very old or very cheap 32-bit phones
//   app-x86_64-release.apk        the Android emulator
//
// Only release builds are split, so `expo run:android` (debug) works as before. All APKs share the
// same versionCode: a phone only ever installs the one that matches it.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// baitless-abi-splits';

const SPLITS = `
    ${MARKER}
    splits {
        abi {
            enable gradle.startParameter.taskNames.any { it.toLowerCase().contains('release') }
            reset()
            include 'arm64-v8a', 'armeabi-v7a', 'x86_64'
            universalApk false
        }
    }
`;

module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    const anchor = /\n(\s*)signingConfigs\s*\{/;
    if (!anchor.test(gradle)) {
      throw new Error('with-abi-splits: could not find signingConfigs in app/build.gradle');
    }
    gradle = gradle.replace(anchor, (match) => `\n${SPLITS}${match}`);
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
