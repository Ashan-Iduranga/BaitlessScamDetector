import '@/global.css';
import '@/lib/i18n';

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
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useCSSVariable } from 'uniwind';

import { useFamilyLive } from '@/features/family/hooks';
import { migrate } from '@/lib/db';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();
migrate();

export default function RootLayout() {
  const router = useRouter();
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSansSinhala_400Regular,
    NotoSansSinhala_600SemiBold,
    NotoSansTamil_400Regular,
    NotoSansTamil_600SemiBold,
  });
  const [background, foreground] = useCSSVariable(['--color-background', '--color-foreground']) as (
    string | undefined
  )[];

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ShareIntentProvider
        options={{ resetOnBackground: true, onResetShareIntent: () => router.replace('/') }}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
            headerStyle: { backgroundColor: background },
            headerTintColor: foreground,
            headerTitleStyle: { fontFamily: 'NotoSans_600SemiBold' },
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="result/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="report/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="family/index" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="family/share" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="family/join" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="academy/practice" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="academy/quiz/[id]" options={{ headerShown: true, title: '' }} />
        </Stack>
        <FamilyLive />
      </ShareIntentProvider>
    </QueryClientProvider>
  );
}

/** Instant Family Guardian alerts while the app is open (needs the query client). */
function FamilyLive() {
  useFamilyLive();
  return null;
}
