// Runs the on-device rules over data/messages.jsonl and prints accuracy, precision, recall and the
// misclassified messages. Usage: npm run eval [-- --source collected] [-- --threshold 35]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeText } from '../src/index.ts';

type Row = {
  id: string;
  text: string;
  label: 'scam' | 'genuine';
  language: string;
  source: string;
};

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const source = arg('source');
// A message counts as "flagged" at or above this score (the caution band starts at 35).
const threshold = Number(arg('threshold') ?? 35);

const file = join(dirname(fileURLToPath(import.meta.url)), '../../../data/messages.jsonl');
const rows: Row[] = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l) as Row)
  .filter((r) => !source || r.source === source);

let tp = 0,
  fp = 0,
  tn = 0,
  fn = 0;
const misses: string[] = [];
const times: number[] = [];

for (const row of rows) {
  const t0 = performance.now();
  const result = analyzeText(row.text);
  times.push(performance.now() - t0);
  const flagged = result.score >= threshold;
  const scam = row.label === 'scam';
  if (flagged && scam) tp++;
  else if (flagged && !scam) fp++;
  else if (!flagged && !scam) tn++;
  else fn++;
  if (flagged !== scam) {
    const kind = scam ? 'MISSED SCAM ' : 'FALSE ALARM ';
    misses.push(
      `${kind} ${row.id} [${row.language}] score=${result.score} rules=${result.flags.map((f) => f.ruleId).join(',') || '-'}\n    ${row.text.slice(0, 110)}`,
    );
  }
}

const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');
times.sort((a, b) => a - b);
const p95 = times[Math.floor(times.length * 0.95)] ?? 0;

console.log(
  `messages: ${rows.length}${source ? ` (source=${source})` : ''}, threshold: ${threshold}`,
);
console.log(`accuracy:  ${pct(tp + tn, rows.length)}`);
console.log(`precision: ${pct(tp, tp + fp)}   (of flagged messages, how many were scams)`);
console.log(`recall:    ${pct(tp, tp + fn)}   (of scams, how many were flagged)`);
console.log(`confusion: TP=${tp} FP=${fp} TN=${tn} FN=${fn}`);
console.log(`rules p95 time: ${p95.toFixed(2)} ms`);
if (misses.length) console.log(`\n${misses.join('\n')}`);
