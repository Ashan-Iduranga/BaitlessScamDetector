import { AppRegistry, Platform } from 'react-native';

import { checkIncomingSms, type IncomingSms } from './check-sms';
import { SMS_GUARD_TASK } from './native';

// Started by the Kotlin SmsReceiver, even when the app is closed. Registered from the app entry
// (index.ts) because Android may start this task without opening any screen.
if (Platform.OS === 'android') {
  AppRegistry.registerHeadlessTask(
    SMS_GUARD_TASK,
    () => (data: IncomingSms) =>
      checkIncomingSms(data).catch((e) => {
        if (__DEV__) console.warn('SMS Guard check failed', e);
      }),
  );
}
