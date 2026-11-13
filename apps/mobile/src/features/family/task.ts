import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { queryClient } from '@/lib/query-client';

import { familyKeys, fetchFamily, fetchGuardianAlerts, isGuardian } from './api';
import { notifyGuardian } from './notify';

export const FAMILY_TASK = 'baitless-family-alerts';

/** Same rhythm as Scam Radar alerts: Android runs it some time after this, so it can be late. */
const CHECK_EVERY_MINUTES = 4 * 60;

/** Background check on a guardian's phone: any new alerts from the people they look after? */
export async function checkFamilyAlerts(): Promise<void> {
  if (!isGuardian()) return;
  const family = await fetchFamily();
  if (!family.lookingAfter.length) {
    await syncFamilyTask(false);
    return;
  }
  const alerts = await fetchGuardianAlerts(family.me);
  // If the app is still running, the Family screen already shows them when the alert is tapped.
  queryClient.setQueryData(familyKeys.links, family);
  queryClient.setQueryData(familyKeys.alerts, alerts);
  notifyGuardian(alerts, family.lookingAfter);
}

/** Must run at app start (index.ts): Android can start the task without opening any screen. */
export function defineFamilyTask(): void {
  TaskManager.defineTask(FAMILY_TASK, async () => {
    try {
      await checkFamilyAlerts();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
      if (__DEV__) console.warn('Family alert check failed', e);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Runs the background check only while this user looks after someone. */
export async function syncFamilyTask(guardian: boolean): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(FAMILY_TASK);
  if (guardian && !registered) {
    await BackgroundTask.registerTaskAsync(FAMILY_TASK, { minimumInterval: CHECK_EVERY_MINUTES });
  } else if (!guardian && registered) {
    await BackgroundTask.unregisterTaskAsync(FAMILY_TASK);
  }
}
