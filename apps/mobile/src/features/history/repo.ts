import { RiskReport, type InputType } from '@baitless/detector';

import { db } from '@/lib/db';

export type ScanRecord = {
  id: string;
  createdAt: number;
  inputType: InputType;
  text: string;
  report: RiskReport;
};

type Row = { id: string; created_at: number; input_type: string; text: string; report: string };

function toRecord(row: Row): ScanRecord | null {
  const parsed = RiskReport.safeParse(JSON.parse(row.report));
  if (!parsed.success) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    inputType: row.input_type as InputType,
    text: row.text,
    report: parsed.data,
  };
}

export function saveScan(record: ScanRecord): void {
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

export function deleteAllScans(): void {
  db.runSync('DELETE FROM scans');
}
