// Background work has to be registered before anything else, because Android can start it without
// opening the app UI: SMS Guard (a new SMS arrived) and Scam Radar alerts (periodic check).
import './src/features/sms-guard/register';
import './src/features/radar/register';
import 'expo-router/entry';
