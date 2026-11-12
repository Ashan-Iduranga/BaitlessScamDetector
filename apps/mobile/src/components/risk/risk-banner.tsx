import type { RiskReport } from '@baitless/detector';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

import { RISK_STYLE } from './risk-style';

/** The verdict at the top of the result screen: icon, label, category and score. */
export function RiskBanner({ report }: { report: RiskReport }) {
  const { t } = useTranslation();
  const style = RISK_STYLE[report.level];
  const iconColor = useCSSVariable(style.colorVar) as string | undefined;
  const category = t(`result.category.${report.category}`);
  const label = t(`result.level.${report.level}`);

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}. ${category}. ${t('result.score', { score: report.score })}`}
      className={`gap-4 rounded-xl border-2 p-5 ${style.container} ${style.accent}`}>
      <View className="flex-row items-center gap-4">
        <style.icon size={56} color={iconColor} weight="fill" />
        <View className="flex-1 gap-1">
          <Text variant="headline" className={style.onContainer}>
            {label}
          </Text>
          {category ? (
            <Text variant="label" className={style.onContainer}>
              {category}
            </Text>
          ) : null}
        </View>
      </View>
      <ScoreBar score={report.score} colorVar={style.colorVar} />
      <Text variant="label" weight="regular" className={style.onContainer}>
        {t('result.score', { score: report.score })}
      </Text>
    </View>
  );
}

function ScoreBar({ score, colorVar }: { score: number; colorVar: string }) {
  const color = useCSSVariable(colorVar) as string | undefined;
  return (
    <View className="h-3 overflow-hidden rounded-full bg-surface" importantForAccessibility="no">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.max(4, score)}%`, backgroundColor: color }}
      />
    </View>
  );
}
