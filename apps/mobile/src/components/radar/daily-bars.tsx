import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type Day = { day: string; count: number };

const dateLabel = (day: string, locale: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString(locale === 'en' ? 'en-LK' : `${locale}-LK`, {
    month: 'short',
    day: 'numeric',
  });

/**
 * One series (reports per day), so one hue and no legend. Thin bars with a 2dp gap and 4dp rounded
 * tops on a recessive baseline. Tapping a day shows its value above the chart; each bar is also
 * read out by screen readers.
 */
export function DailyBars({ days }: { days: Day[] }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.count));
  const current = days[selected];
  const highest = Math.max(0, ...days.map((d) => d.count));

  if (!current) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text accessibilityLiveRegion="polite" weight="semibold">
          {t('radar.daily.readout', {
            date: dateLabel(current.day, i18n.language),
            n: current.count,
          })}
        </Text>
        <Text variant="label" weight="regular" className="text-muted">
          {t('radar.daily.highest', { n: highest })}
        </Text>
      </View>

      <View className="h-32 flex-row items-end gap-0.5 border-b border-outline">
        {days.map((d, i) => (
          <Pressable
            key={d.day}
            accessibilityRole="button"
            accessibilityLabel={t('radar.daily.bar', {
              date: dateLabel(d.day, i18n.language),
              n: d.count,
            })}
            accessibilityState={{ selected: i === selected }}
            onPress={() => setSelected(i)}
            className="h-full flex-1 justify-end">
            <View
              style={{ height: d.count ? `${(d.count / max) * 100}%` : 2 }}
              className={d.count ? 'rounded-t bg-primary' : 'bg-outline-variant'}
            />
          </Pressable>
        ))}
      </View>

      {/* Marks the selected day under the axis, so the selection is not shown by colour alone. */}
      <View className="-mt-2 flex-row gap-0.5" importantForAccessibility="no-hide-descendants">
        {days.map((d, i) => (
          <View key={d.day} className="flex-1 items-center">
            {i === selected ? <View className="size-1.5 rounded-full bg-foreground" /> : null}
          </View>
        ))}
      </View>

      <View
        className="-mt-1 flex-row justify-between"
        importantForAccessibility="no-hide-descendants">
        <Text variant="label" weight="regular" className="text-muted">
          {dateLabel(days[0]!.day, i18n.language)}
        </Text>
        <Text variant="label" weight="regular" className="text-muted">
          {t('radar.daily.today')}
        </Text>
      </View>
    </View>
  );
}
