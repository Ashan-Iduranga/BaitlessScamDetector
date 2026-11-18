// Signs release builds with your own upload key instead of the shared debug key.
//
// The key and its passwords never live in this repo. Put them in your user-level Gradle properties
// (Windows: %USERPROFILE%\.gradle\gradle.properties, macOS/Linux: ~/.gradle/gradle.properties):
//
//   BAITLESS_UPLOAD_STORE_FILE=C:/Users/you/.baitless/baitless-upload.jks
//   BAITLESS_UPLOAD_STORE_PASSWORD=...
//   BAITLESS_UPLOAD_KEY_ALIAS=baitless
//   BAITLESS_UPLOAD_KEY_PASSWORD=...
//
// Without them, a release build stops with an error: the debug key is public, so an APK signed
// with it could be replaced by a tampered one. To build one anyway for a quick local test, add
// BAITLESS_ALLOW_DEBUG_SIGNING=true. See docs/release.md.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// baitless-release-signing';

const RELEASE_SIGNING = `
        ${MARKER}
        release {
            if (project.hasProperty('BAITLESS_UPLOAD_STORE_FILE')) {
                storeFile file(BAITLESS_UPLOAD_STORE_FILE)
                storePassword BAITLESS_UPLOAD_STORE_PASSWORD
                keyAlias BAITLESS_UPLOAD_KEY_ALIAS
                keyPassword BAITLESS_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    // 1. Add a "release" signing config next to the generated "debug" one.
    const debugConfig = /signingConfigs\s*\{\s*debug\s*\{[^}]*\}/;
    if (!debugConfig.test(gradle)) {
      throw new Error(
        'with-release-signing: could not find signingConfigs.debug in app/build.gradle',
      );
    }
    gradle = gradle.replace(debugConfig, (match) => match + RELEASE_SIGNING);

    // 2. Use it for release builds when the key is configured.
    const releaseUsesDebug =
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!releaseUsesDebug.test(gradle)) {
      throw new Error('with-release-signing: could not find the release signingConfig line');
    }
    gradle = gradle.replace(
      releaseUsesDebug,
      "$1signingConfig project.hasProperty('BAITLESS_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );

    // 3. Refuse to build a release APK with the public debug key unless asked to.
    gradle += `
${MARKER}: stop release builds that would use the public debug key.
gradle.taskGraph.whenReady { graph ->
    def releaseTask = graph.allTasks.any { it.project == project && it.name ==~ /(assemble|bundle|package)Release/ }
    if (releaseTask && !project.hasProperty('BAITLESS_UPLOAD_STORE_FILE') && !project.hasProperty('BAITLESS_ALLOW_DEBUG_SIGNING')) {
        throw new GradleException('Release builds need your upload key. See docs/release.md, or set BAITLESS_ALLOW_DEBUG_SIGNING=true for a local test build.')
    }
}
`;

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
