// Checks data/messages.jsonl and prints counts. Exits 1 on any invalid line.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), 'messages.jsonl');

const LABELS = new Set(['scam', 'genuine']);
const CATEGORIES = new Set([
  'bank',
  'lottery_prize',
  'courier',
  'job',
  'investment',
  'telecom',
  'government',
  'romance',
  'shopping',
  'other',
  'none',
]);
const LANGUAGES = new Set(['en', 'si', 'ta', 'singlish']);
const SOURCES = new Set(['synthetic', 'collected']);

const errors = [];
const ids = new Set();
const count = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const byLabel = new Map();
const byLanguage = new Map();
const bySource = new Map();

const lines = readFileSync(file, 'utf8').split(/\r?\n/);
lines.forEach((line, i) => {
  if (!line.trim()) return;
  const n = i + 1;
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    errors.push(`line ${n}: not valid JSON`);
    return;
  }
  if (typeof row.id !== 'string' || !row.id) errors.push(`line ${n}: missing id`);
  else if (ids.has(row.id)) errors.push(`line ${n}: duplicate id ${row.id}`);
  else ids.add(row.id);
  if (typeof row.text !== 'string' || !row.text.trim()) errors.push(`line ${n}: empty text`);
  if (!LABELS.has(row.label)) errors.push(`line ${n}: bad label ${row.label}`);
  if (!CATEGORIES.has(row.category)) errors.push(`line ${n}: bad category ${row.category}`);
  if (!LANGUAGES.has(row.language)) errors.push(`line ${n}: bad language ${row.language}`);
  if (!SOURCES.has(row.source)) errors.push(`line ${n}: bad source ${row.source}`);
  if (row.label === 'genuine' && row.category !== 'none')
    errors.push(`line ${n}: genuine messages must use category "none"`);
  if (row.label === 'scam' && row.category === 'none')
    errors.push(`line ${n}: scam messages need a category`);
  count(byLabel, row.label);
  count(byLanguage, row.language);
  count(bySource, row.source);
});

console.log(`messages: ${ids.size}`);
console.log('by label:   ', Object.fromEntries(byLabel));
console.log('by language:', Object.fromEntries(byLanguage));
console.log('by source:  ', Object.fromEntries(bySource));
const collected = bySource.get('collected') ?? 0;
if (collected < 200) console.log(`note: ${collected}/200 collected messages so far`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.join('\n'));
  process.exit(1);
}
