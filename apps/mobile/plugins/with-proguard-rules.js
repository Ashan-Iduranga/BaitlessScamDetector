// Extra R8 keep rules for release builds (android/app/proguard-rules.pro is generated, so they are
// added here).
//
// WorkManager (used by expo-background-task for the Radar and Family checks) creates its Room
// database by reflection through the no-argument constructor of WorkDatabase_Impl. Room 2.6's own
// rule keeps the class but not its constructor, and R8 full mode then removes it, so the release
// app crashed on launch with NoSuchMethodException: WorkDatabase_Impl.<init>.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '# baitless-proguard-rules';

const RULES = `
${MARKER}
# Room databases (WorkManager's WorkDatabase_Impl) are created through their no-arg constructor.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
`;

module.exports = function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
      const contents = fs.readFileSync(file, 'utf8');
      if (!contents.includes(MARKER)) fs.writeFileSync(file, contents + RULES);
      return cfg;
    },
  ]);
};
