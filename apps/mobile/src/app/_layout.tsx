import '@/global.css';

import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSansSinhala_400Regular,
  NotoSansSinhala_600SemiBold,
} from '@expo-google-fonts/noto-sans-sinhala';
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_600SemiBold,
} from '@expo-google-fonts/noto-sans-tamil';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSansSinhala_400Regular,
    NotoSansSinhala_600SemiBold,
    NotoSansTamil_400Regular,
    NotoSansTamil_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
