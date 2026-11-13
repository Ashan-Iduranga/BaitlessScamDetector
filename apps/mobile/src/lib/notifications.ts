import { PermissionsAndroid, Platform } from 'react-native';

export type NotificationPermission = 'granted' | 'denied' | 'blocked';

/** Android 13+ asks before an app may show notifications. */
export async function allowNotifications(): Promise<NotificationPermission> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return 'granted';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
}
