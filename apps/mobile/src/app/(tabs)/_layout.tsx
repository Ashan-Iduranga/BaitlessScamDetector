import { Tabs } from 'expo-router';
import {
  ChartLineUp,
  ClockCounterClockwise,
  Gear,
  ShieldCheck,
  type Icon,
} from 'phosphor-react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

function tabIcon(IconCmp: Icon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <IconCmp size={24} color={color as string} weight={focused ? 'fill' : 'regular'} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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
        tabBarLabelStyle: { fontFamily: 'NotoSans_500Medium', fontSize: 13 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Scan', tabBarIcon: tabIcon(ShieldCheck) }} />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: tabIcon(ClockCounterClockwise) }}
      />
      <Tabs.Screen
        name="radar"
        options={{ title: 'Scam Radar', tabBarIcon: tabIcon(ChartLineUp) }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon(Gear) }} />
    </Tabs>
  );
}
