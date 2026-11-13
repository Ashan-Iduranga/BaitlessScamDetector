import { Tabs } from 'expo-router';
import {
  ChartLineUp,
  ClockCounterClockwise,
  Gear,
  GraduationCap,
  ShieldCheck,
  type Icon,
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

function tabIcon(IconCmp: Icon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <IconCmp size={24} color={color as string} weight={focused ? 'fill' : 'regular'} />;
  }
  return TabIcon;
}

const LABEL_FONT: Record<string, string> = {
  en: 'NotoSans_500Medium',
  si: 'NotoSansSinhala_600SemiBold',
  ta: 'NotoSansTamil_600SemiBold',
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [primary, muted, surface, border] = useCSSVariable([
    '--color-primary',
    '--color-muted',
    '--color-surface',
    '--color-outline-variant',
  ]) as (string | undefined)[];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: muted,
        tabBarStyle: {
          backgroundColor: surface,
          borderTopColor: border,
          // Keep labels clear of the Android gesture / 3-button navigation bar.
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarLabelStyle: { fontFamily: LABEL_FONT[i18n.language] ?? LABEL_FONT.en, fontSize: 13 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.scan'), tabBarIcon: tabIcon(ShieldCheck) }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('tabs.history'), tabBarIcon: tabIcon(ClockCounterClockwise) }}
      />
      <Tabs.Screen
        name="radar"
        options={{ title: t('tabs.radar'), tabBarIcon: tabIcon(ChartLineUp) }}
      />
      <Tabs.Screen
        name="academy"
        options={{ title: t('tabs.academy'), tabBarIcon: tabIcon(GraduationCap) }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: tabIcon(Gear) }}
      />
    </Tabs>
  );
}
