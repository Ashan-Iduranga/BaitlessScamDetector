import { analyzeText, buildReport } from '@baitless/detector';
import { randomUUID } from 'expo-crypto';

import { historyKeys } from '@/features/history/hooks';
import { saveScan } from '@/features/history/repo';
import { migrate } from '@/lib/db';
import i18n from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';

import { SmsGuard } from './native';

export type IncomingSms = { sender: string; body: string; receivedAt: number };

/** Same limit as the Scan screen (ScanInput). */
const MAX_LENGTH = 5000;

/**
 * Background check for one incoming SMS. It runs only the on-device rules: an SMS that arrives on
 * its own is never sent to the server. Safe messages are not saved anywhere.
 */
export async function checkIncomingSms({ sender, body, receivedAt }: IncomingSms): Promise<void> {
  const text = body.trim().slice(0, MAX_LENGTH);
  if (!text) return;

  const report = buildReport(analyzeText(text), null);
  if (report.level === 'safe') return;

  // The app UI may not have started, so the database may not be ready yet.
  migrate();
  const id = randomUUID();
  saveScan({ id, createdAt: receivedAt || Date.now(), inputType: 'sms', text, report });
  // If the app is open, show the new item in History straight away.
  void queryClient.invalidateQueries({ queryKey: historyKeys.all });

  const t = i18n.t.bind(i18n);
  SmsGuard?.showWarning(
    id,
    t(`smsGuard.notify.title.${report.level}`),
    t('smsGuard.notify.body', { sender: sender || t('smsGuard.notify.unknownSender') }),
    t('smsGuard.notify.channel'),
  );
}
