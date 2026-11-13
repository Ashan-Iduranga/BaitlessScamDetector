// SMS Guard's background task has to be registered before anything else, because Android can start
// it without opening the app UI.
import './src/features/sms-guard/register';
import 'expo-router/entry';
