// Copies the shared Zod schema from packages/detector into the Edge Functions folder, because
// Supabase deploys each function from supabase/functions only.
// `node scripts/sync-shared.mjs` writes it; `--check` fails if the copy is out of date (CI).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'packages/detector/src/schema.ts');
const target = join(root, 'supabase/functions/_shared/schema.ts');

const header =
  '// GENERATED from packages/detector/src/schema.ts by scripts/sync-shared.mjs. Do not edit.\n\n';
const expected = header + readFileSync(source, 'utf8');

if (process.argv.includes('--check')) {
  let actual = '';
  try {
    actual = readFileSync(target, 'utf8');
  } catch {}
  if (actual.replace(/\r\n/g, '\n') !== expected.replace(/\r\n/g, '\n')) {
    console.error('supabase/functions/_shared/schema.ts is out of date. Run: npm run sync:shared');
    process.exit(1);
  }
  console.log('shared schema is in sync');
} else {
  writeFileSync(target, expected);
  console.log(`wrote ${target}`);
}
