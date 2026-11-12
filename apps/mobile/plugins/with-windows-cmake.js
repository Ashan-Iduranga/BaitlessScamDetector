// Windows-only build fix. The Android SDK's default CMake 3.22.1 ships a ninja that cannot handle
// paths over 260 characters, and this repo's path is long enough to hit that. When a newer SDK
// CMake (whose ninja 1.12+ supports long paths) is installed, point the build at it through
// android/local.properties. On other machines (CI, EAS) this does nothing.
const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');

const CMAKE_VERSION = '3.31.6';

function findCmakeDir() {
  if (process.platform !== 'win32') return null;
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  const dir = path.join(sdk, 'cmake', CMAKE_VERSION);
  return fs.existsSync(path.join(dir, 'bin', 'ninja.exe')) ? dir : null;
}

module.exports = function withWindowsCmake(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const cmakeDir = findCmakeDir();
      if (!cmakeDir) return cfg;
      const file = path.join(cfg.modRequest.platformProjectRoot, 'local.properties');
      const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      const lines = existing.split(/\r?\n/).filter((l) => l && !l.startsWith('cmake.dir='));
      // local.properties is a Java properties file: backslashes must be escaped.
      lines.push(`cmake.dir=${cmakeDir.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}`);
      fs.writeFileSync(file, lines.join('\n') + '\n');
      return cfg;
    },
  ]);
};
