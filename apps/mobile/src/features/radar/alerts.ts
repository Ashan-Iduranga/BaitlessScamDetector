import { defang } from '@baitless/detector';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { SmsGuard } from '@/features/sms-guard/native';
import i18n from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';

import { fetchRadar, radarKeys } from './api';
import { lastSeenConfirmedAt, markSeen, newestConfirmed, newSince } from './seen';

export const RADAR_TASK = 'baitless-radar-alerts';

/**
 * Minutes between checks. Android treats it as a minimum and runs the check later, when the
 * battery and network allow, so alerts can be a few hours late.
 */
const CHECK_EVERY_MINUTES = 4 * 60;

/** Asks the server for newly confirmed scams and shows one notification for all of them. */
export async function checkForNewScams(): Promise<void> {
  const summary = await fetchRadar();
  // If the app is still running, Scam Radar already shows these when the notification is tapped.
  queryClient.setQueryData(radarKeys.summary, summary);
  const fresh = newSince(summary.trending, lastSeenConfirmedAt());
  if (!fresh.length || !SmsGuard) return;

  const t = i18n.t.bind(i18n);
  const link = defang(fresh[0]!.value);
  const body =
    fresh.length === 1
      ? t('radar.notify.bodyOne', { link })
      : t('radar.notify.bodyMany', { count: fresh.length, link });
  const shown = SmsGuard.showAlert(
    'radar-new-scams',
    t('radar.notify.title'),
    body,
    'radar_alerts',
    t('radar.notify.channel'),
    'baitless://radar',
  );
  if (shown) markSeen(newestConfirmed(fresh));
}

/** Must run at app start (index.ts): Android can start the task without opening any screen. */
export function defineRadarTask(): void {
  TaskManager.defineTask(RADAR_TASK, async () => {
    try {
      await checkForNewScams();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
      if (__DEV__) console.warn('Scam Radar check failed', e);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export const radarAlertsOn = () => TaskManager.isTaskRegisteredAsync(RADAR_TASK);

export async function startRadarAlerts(): Promise<void> {
  // Only scams confirmed from now on are "new"; older ones are already on the Radar screen.
  markSeen(Date.now());
  await BackgroundTask.registerTaskAsync(RADAR_TASK, { minimumInterval: CHECK_EVERY_MINUTES });
}

export const stopRadarAlerts = () => BackgroundTask.unregisterTaskAsync(RADAR_TASK);
