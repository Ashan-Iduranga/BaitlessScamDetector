import { Platform } from 'react-native';

import { defineRadarTask } from './alerts';

// Alerts use the Android notifier in modules/sms-guard.
if (Platform.OS === 'android') defineRadarTask();
