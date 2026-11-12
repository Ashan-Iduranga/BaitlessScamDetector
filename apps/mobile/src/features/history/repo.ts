import { RiskReport, type InputType } from '@baitless/detector';

import { db } from '@/lib/db';

export type ScanRecord = {
  id: string;
  createdAt: number;
  inputType: InputType;
  text: string;
  report: RiskReport;
  /** When the user reported it to the community list, if they did. */
  reportedAt: number | null;
};

type Row = {
  id: string;
  created_at: number;
  input_type: string;
  text: string;
  report: string;
  reported_at: number | null;
};

function toRecord(row: Row): ScanRecord | null {
  const parsed = RiskReport.safeParse(JSON.parse(row.report));
  if (!parsed.success) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    inputType: row.input_type as InputType,
    text: row.text,
    report: parsed.data,
    reportedAt: row.reported_at ?? null,
  };
}

export function saveScan(record: Omit<ScanRecord, 'reportedAt'>): void {
  db.runSync(
    'INSERT INTO scans (id, created_at, input_type, text, report) VALUES (?, ?, ?, ?, ?)',
    record.id,
    record.createdAt,
    record.inputType,
    record.text,
    JSON.stringify(record.report),
  );
}

export function getScan(id: string): ScanRecord | null {
  const row = db.getFirstSync<Row>('SELECT * FROM scans WHERE id = ?', id);
  return row ? toRecord(row) : null;
}

export function listScans(limit = 200): ScanRecord[] {
  return db
    .getAllSync<Row>('SELECT * FROM scans ORDER BY created_at DESC LIMIT ?', limit)
    .map(toRecord)
    .filter((r): r is ScanRecord => r !== null);
}

export function markReported(id: string, at = Date.now()): void {
  db.runSync('UPDATE scans SET reported_at = ? WHERE id = ?', at, id);
}

export function deleteAllScans(): void {
  db.runSync('DELETE FROM scans');
}
