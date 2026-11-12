import {
  extractPhones,
  maskPii,
  reportableIndicators,
  type ScamCategory,
} from '@baitless/detector';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { historyKeys } from '@/features/history/hooks';
import { markReported, type ScanRecord } from '@/features/history/repo';
import { ensureSession, supabase } from '@/lib/supabase';

import { reportFor } from './indicators';

export type ReportCategory = Exclude<ScamCategory, 'none'>;

export const REPORT_CATEGORIES: ReportCategory[] = [
  'bank',
  'courier',
  'lottery_prize',
  'telecom',
  'government',
  'job',
  'investment',
  'shopping',
  'romance',
  'other',
];

/**
 * Sri Lanka CERT asks for scams and personal financial fraud to go through its online incident
 * portal (not e-mail). 101 is its hotline for urgent cyber incidents. Checked 2026-11-12.
 */
export const CERT_REPORT_URL = 'https://cert.gov.lk/report_incident';
export const CERT_HOTLINE = '101';

export type ReportFailure = 'nothing_to_report' | 'rate_limited' | 'offline' | 'failed';

class ReportError extends Error {
  constructor(readonly reason: ReportFailure) {
    super(reason);
  }
}

export const reportFailure = (e: unknown): ReportFailure =>
  e instanceof ReportError ? e.reason : 'failed';

/** Adds the scan's links and (hashed) phone numbers to the community list. */
async function submitReport(scan: ScanRecord, category: ReportCategory): Promise<void> {
  const indicators = await reportFor(scan.text);
  if (!indicators.domains.length && !indicators.urls.length && !indicators.phoneHashes.length) {
    throw new ReportError('nothing_to_report');
  }
  try {
    await ensureSession();
  } catch {
    throw new ReportError('offline');
  }
  const { error } = await supabase.from('reports').insert({
    category,
    domains: indicators.domains,
    urls: indicators.urls,
    phone_hashes: indicators.phoneHashes,
  });
  if (!error) return;
  if (error.message.includes('report_rate_limited')) throw new ReportError('rate_limited');
  if (/network request failed|fetch failed/i.test(error.message)) throw new ReportError('offline');
  if (__DEV__) console.warn('report failed', error);
  throw new ReportError('failed');
}

export function useSubmitReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ scan, category }: { scan: ScanRecord; category: ReportCategory }) =>
      submitReport(scan, category),
    onSuccess: (_, { scan }) => {
      markReported(scan.id);
      client.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

/**
 * Text people can paste into the CERT portal or send to their bank. In English, because it goes to
 * an authority. The message body has the user's personal details removed; the links and numbers
 * are listed in full because they are the evidence. People see it in the share sheet before sending.
 */
export function authorityReportText(scan: ScanRecord, categoryLabel: string): string {
  const { domains, urls } = reportableIndicators(scan.text);
  const phones = [...new Set(extractPhones(scan.text).map((p) => p.raw.trim()))];
  const received = new Date(scan.createdAt).toISOString().slice(0, 16).replace('T', ' ');
  const lines = [
    'Suspected scam message',
    `Type: ${categoryLabel}`,
    `Checked on: ${received} (UTC)`,
  ];
  const links = [...domains, ...urls];
  if (links.length) lines.push(`Links / websites: ${links.join(', ')}`);
  if (phones.length) lines.push(`Phone numbers in the message: ${phones.join(', ')}`);
  lines.push('', 'Message (my personal details removed):', maskPii(scan.text).masked);
  return lines.join('\n');
}
