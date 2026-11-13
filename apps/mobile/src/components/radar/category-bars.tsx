import type { ScamCategory } from '@baitless/detector';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type Row = { category: ScamCategory; count: number };

/**
 * Magnitude by type: sorted horizontal bars in one hue. The type is written above each bar and the
 * number beside it, so colour never carries identity.
 */
export function CategoryBars({ rows }: { rows: Row[] }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <View className="gap-4">
      {rows.map((r) => {
        const label =
          r.category === 'other' ? t('radar.otherCategory') : t(`result.category.${r.category}`);
        return (
          <View
            key={r.category}
            accessible
            accessibilityLabel={t('radar.types.row', { label, n: r.count })}
            className="gap-1.5">
            <View className="flex-row justify-between gap-3">
              <Text className="flex-1">{label}</Text>
              <Text weight="semibold">{r.count}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface-container">
              <View
                style={{ width: `${(r.count / max) * 100}%` }}
                className="h-full rounded-full bg-primary"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
