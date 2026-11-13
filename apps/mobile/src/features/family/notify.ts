import type { ScamCategory } from '@baitless/detector';
import Storage from 'expo-sqlite/kv-store';
import type { TFunction } from 'i18next';

import { SmsGuard } from '@/features/sms-guard/native';
import i18n from '@/lib/i18n';

import type { FamilyLink, GuardianAlert } from './api';

/** Newest alert id the guardian has already been told about. Ids only grow. */
const LAST_SEEN = 'family.lastSeenAlertId';

export const lastSeenAlertId = () => Number(Storage.getItemSync(LAST_SEEN) ?? 0) || 0;

export function markAlertsSeen(alerts: GuardianAlert[]): void {
  const newest = alerts.reduce((max, a) => Math.max(max, a.id), 0);
  if (newest > lastSeenAlertId()) Storage.setItemSync(LAST_SEEN, String(newest));
}

export const scamTypeLabel = (t: TFunction, category: ScamCategory) =>
  category === 'none' || category === 'other'
    ? t('family.otherScam')
    : t(`result.category.${category}`);

export const nameFor = (links: FamilyLink[], protectedId: string, fallback: string) =>
  links.find((l) => l.protected_id === protectedId)?.protected_name ?? fallback;

/** One notification for every alert the guardian has not been told about yet. */
export function notifyGuardian(alerts: GuardianAlert[], links: FamilyLink[]): void {
  const since = lastSeenAlertId();
  const fresh = alerts.filter((a) => a.id > since);
  const first = fresh[0];
  if (!first || !SmsGuard) return;

  const t = i18n.t.bind(i18n);
  const name = nameFor(links, first.protected_id, t('family.someone'));
  const [title, body] =
    fresh.length === 1
      ? [
          t('family.notify.title', { name }),
          t(`family.notify.body.${first.source}`, {
            name,
            type: scamTypeLabel(t, first.category),
          }),
        ]
      : [t('family.notify.titleMany'), t('family.notify.bodyMany', { n: fresh.length })];

  const shown = SmsGuard.showAlert(
    'family-alerts',
    title,
    body,
    'family_alerts',
    t('family.notify.channel'),
    'baitless://family',
  );
  if (shown) markAlertsSeen(fresh);
}
