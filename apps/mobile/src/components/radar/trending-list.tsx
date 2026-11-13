import { defang } from '@baitless/detector';
import { ShieldWarning } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';
import type { TrendingScam } from '@/features/radar/api';

const dateLabel = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale === 'en' ? 'en-LK' : `${locale}-LK`, {
    month: 'short',
    day: 'numeric',
  });

/**
 * Confirmed scam links. Shown "defanged" (dots as [.]) and not selectable, so nobody opens one by
 * accident. Risk is shown with colour + icon + text.
 */
export function TrendingList({ items, newSince }: { items: TrendingScam[]; newSince: number }) {
  const { t, i18n } = useTranslation();
  const danger = useCSSVariable('--color-danger') as string | undefined;

  return (
    <View className="gap-3">
      {items.map((item) => {
        const isNew = item.confirmedAt !== null && Date.parse(item.confirmedAt) > newSince;
        const category = item.category
          ? item.category === 'other'
            ? t('radar.otherCategory')
            : t(`result.category.${item.category}`)
          : null;
        return (
          <View
            key={`${item.kind}:${item.value}`}
            className="flex-row gap-3 rounded-md border border-outline-variant bg-surface p-4">
            <ShieldWarning size={24} color={danger} weight="fill" />
            <View className="flex-1 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="label" className="text-danger">
                  {t('radar.trending.confirmed')}
                </Text>
                {isNew ? (
                  <View className="rounded-full bg-primary-container px-2 py-0.5">
                    <Text variant="label" className="text-on-primary-container">
                      {t('radar.trending.new')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text weight="semibold" selectable={false}>
                {defang(item.value)}
              </Text>
              {category ? <Text className="text-muted">{category}</Text> : null}
              <Text variant="label" weight="regular" className="text-muted">
                {t('radar.trending.meta', {
                  n: item.reportCount,
                  date: dateLabel(item.firstSeen, i18n.language),
                })}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
