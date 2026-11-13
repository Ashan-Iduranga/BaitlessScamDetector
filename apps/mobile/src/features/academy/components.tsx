import { Medal, Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

import type { BadgeId } from './content';

/** "Question 2 of 4" with a thin bar, so people always know how far they are. */
export function StepProgress({ label, value }: { label: string; value: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      className="gap-2">
      <Text variant="label" className="text-muted">
        {label}
      </Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-container">
        <View style={{ width: `${value * 100}%` }} className="h-full rounded-full bg-primary" />
      </View>
    </View>
  );
}

/** Points and new badges from a finished practice or quiz. */
export function EarnedSummary({ points, badges }: { points: number; badges: BadgeId[] }) {
  const { t } = useTranslation();
  const primary = useCSSVariable('--color-primary') as string | undefined;
  return (
    <View accessibilityLiveRegion="polite" className="gap-3 rounded-lg bg-primary-container p-4">
      <View className="flex-row items-center gap-3">
        <Star size={24} color={primary} weight="fill" />
        <Text variant="title" className="flex-1 text-on-primary-container">
          {points > 0 ? t('academy.earnedPoints', { n: points }) : t('academy.noNewPoints')}
        </Text>
      </View>
      {badges.map((id) => (
        <View key={id} className="flex-row items-center gap-3">
          <Medal size={24} color={primary} weight="fill" />
          <Text className="flex-1 text-on-primary-container">
            {t('academy.newBadge', { name: t(`academy.badges.${id}.name`) })}
          </Text>
        </View>
      ))}
    </View>
  );
}
