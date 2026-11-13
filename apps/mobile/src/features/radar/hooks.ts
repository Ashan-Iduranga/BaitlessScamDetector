import { useQuery } from '@tanstack/react-query';
import * as BackgroundTask from 'expo-background-task';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { SmsGuard } from '@/features/sms-guard/native';

import { radarAlertsOn, startRadarAlerts, stopRadarAlerts } from './alerts';
import { fetchRadar, radarKeys } from './api';

/** Community totals. Refreshed when older than 5 minutes, or by pull-to-refresh. */
export function useRadar() {
  const query = useQuery({
    queryKey: radarKeys.summary,
    queryFn: fetchRadar,
    staleTime: 5 * 60_000,
  });
  const { isStale, refetch } = query;
  // Tabs stay mounted, so refresh when the tab comes back into view with old data.
  useFocusEffect(
    useCallback(() => {
      if (isStale) void refetch();
    }, [isStale, refetch]),
  );
  return query;
}

/** Android 13+ asks before showing notifications. */
async function allowNotifications(): Promise<'granted' | 'denied' | 'blocked'> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return 'granted';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
}

export type RadarAlertsState = {
  available: boolean;
  enabled: boolean;
  busy: boolean;
  problem: 'denied' | 'blocked' | null;
  setEnabled: (on: boolean) => Promise<void>;
};

export function useRadarAlerts(): RadarAlertsState {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<RadarAlertsState['problem']>(null);

  useEffect(() => {
    if (!SmsGuard) return;
    void Promise.all([BackgroundTask.getStatusAsync(), radarAlertsOn()]).then(([status, on]) => {
      setAvailable(status === BackgroundTask.BackgroundTaskStatus.Available);
      setEnabledState(on);
    });
  }, []);

  const setEnabled = useCallback(async (on: boolean) => {
    setBusy(true);
    try {
      if (!on) {
        await stopRadarAlerts();
        setEnabledState(false);
        return;
      }
      const permission = await allowNotifications();
      setProblem(permission === 'granted' ? null : permission);
      if (permission !== 'granted') return;
      await startRadarAlerts();
      setEnabledState(true);
    } finally {
      setBusy(false);
    }
  }, []);

  return { available, enabled, busy, problem, setEnabled };
}
