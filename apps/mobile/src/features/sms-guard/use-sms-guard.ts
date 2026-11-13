import { useCallback, useEffect, useState } from 'react';
import { AppState, PermissionsAndroid, Platform, type Permission } from 'react-native';

import { SmsGuard } from './native';

/** Android 13+ needs permission to show notifications. */
function neededPermissions(): Permission[] {
  const list: Permission[] = [PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    list.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  return list;
}

async function hasPermissions(): Promise<boolean> {
  const results = await Promise.all(neededPermissions().map((p) => PermissionsAndroid.check(p)));
  return results.every(Boolean);
}

/**
 * True while the permission dialog is open. Closing it makes the app "active" again, and the sync
 * below must not switch the guard off before the answer arrives.
 */
let requesting = false;

/** On only when the user turned it on and every permission is still granted. */
async function currentlyOn(): Promise<boolean> {
  const on = (SmsGuard?.isEnabled() ?? false) && (await hasPermissions());
  if (!on) SmsGuard?.setEnabled(false);
  return on;
}

export type SmsGuardState = {
  /** False on iOS and web: SMS Guard is Android only. */
  available: boolean;
  enabled: boolean;
  busy: boolean;
  /** The user said "Don't allow" in a way that only the system settings can undo. */
  blocked: boolean;
  /** Last request was refused (but can be asked again). */
  denied: boolean;
  setEnabled: (on: boolean) => Promise<void>;
};

export function useSmsGuard(): SmsGuardState {
  const [enabled, setEnabledState] = useState(() => SmsGuard?.isEnabled() ?? false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [denied, setDenied] = useState(false);

  // People can take a permission away in the system settings: switch off to match.
  useEffect(() => {
    if (!SmsGuard) return;
    const sync = () => {
      if (requesting) return;
      void currentlyOn().then(setEnabledState);
    };
    sync();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') sync();
    });
    return () => sub.remove();
  }, []);

  const setEnabled = useCallback(async (on: boolean) => {
    if (!SmsGuard) return;
    if (!on) {
      SmsGuard.setEnabled(false);
      setEnabledState(false);
      return;
    }
    setBusy(true);
    requesting = true;
    try {
      const results = Object.values(await PermissionsAndroid.requestMultiple(neededPermissions()));
      const granted = results.every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
      setBlocked(results.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN));
      setDenied(!granted);
      SmsGuard.setEnabled(granted);
      setEnabledState(granted);
    } finally {
      requesting = false;
      setBusy(false);
    }
  }, []);

  return { available: SmsGuard !== null, enabled, busy, blocked, denied, setEnabled };
}
