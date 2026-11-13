// Background work has to be registered before anything else, because Android can start it without
// opening the app UI: SMS Guard (a new SMS arrived), and the periodic Scam Radar and Family
// Guardian checks.
import './src/features/sms-guard/register';
import './src/features/radar/register';
import './src/features/family/register';
import 'expo-router/entry';
