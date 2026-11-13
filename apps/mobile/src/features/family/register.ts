import { Platform } from 'react-native';

import { defineFamilyTask } from './task';

// Alerts use the Android notifier in modules/sms-guard.
if (Platform.OS === 'android') defineFamilyTask();
