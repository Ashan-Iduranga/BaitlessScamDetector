import { openDatabaseSync } from 'expo-sqlite';

/** On-device database. Scan history never leaves the phone. */
export const db = openDatabaseSync('baitless.db');

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS scans (
     id TEXT PRIMARY KEY NOT NULL,
     created_at INTEGER NOT NULL,
     input_type TEXT NOT NULL,
     text TEXT NOT NULL,
     report TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS scans_created_at ON scans (created_at DESC);`,
  // Phase 2: when the user reported this scan to the community list.
  `ALTER TABLE scans ADD COLUMN reported_at INTEGER;`,
];

/** Runs pending migrations, tracked with SQLite's user_version. */
export function migrate(): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[version]!);
      db.execSync(`PRAGMA user_version = ${version + 1}`);
    });
    version++;
  }
}
