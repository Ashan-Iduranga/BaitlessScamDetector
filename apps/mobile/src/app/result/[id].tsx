import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, UsersThree, WarningCircle, WifiSlash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { HighlightedMessage } from '@/components/risk/highlighted-message';
import { RiskBanner } from '@/components/risk/risk-banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useScan } from '@/features/history/hooks';

export default function ResultScreen() {
  const { t } = useTranslation();
  const { id, fallback } = useLocalSearchParams<{ id: string; fallback?: string }>();
  const { data: scan } = useScan(id);
  const [muted, safe] = useCSSVariable(['--color-muted', '--color-safe']) as (string | undefined)[];

  if (!scan) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted">{t('result.notFound')}</Text>
      </View>
    );
  }

  const { report, text } = scan;
  // Unique reasons, in message order.
  const reasons = [...new Set(report.flags.map((f) => f.ruleId))].filter(
    (id) => !(report.level === 'safe' && id === 'brand_mention'),
  );
  // Hard evidence from outside the phone comes first.
  const evidence = [
    report.sources.community ? t('result.evidence.community') : null,
    report.sources.safeBrowsing ? t('result.evidence.safeBrowsing') : null,
  ].filter((e): e is string => e !== null);
  const sources = (Object.keys(report.sources) as (keyof typeof report.sources)[])
    .filter((k) => report.sources[k])
    .map((k) => t(`result.sourceNames.${k}`))
    .join(', ');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pb-10 pt-2">
      <RiskBanner report={report} />

      {report.offline ? (
        <View className="flex-row items-start gap-3 rounded-md bg-surface-container p-4">
          {fallback === 'offline' ? (
            <WifiSlash size={20} color={muted} />
          ) : (
            <WarningCircle size={20} color={muted} />
          )}
          <Text variant="label" weight="regular" className="flex-1 text-muted">
            {fallback === 'offline' ? t('result.offline') : t('result.serverBusy')}
          </Text>
        </View>
      ) : null}

      <Section title={t('result.why')}>
        {report.explanation ? <Text>{report.explanation}</Text> : null}
        {evidence.length || reasons.length ? (
          <View className="gap-2">
            {evidence.map((line) => (
              <View key={line} className="flex-row gap-3">
                <Text className="text-danger">•</Text>
                <Text weight="semibold" className="flex-1">
                  {line}
                </Text>
              </View>
            ))}
            {reasons.map((id) => (
              <View key={id} className="flex-row gap-3">
                <Text className="text-muted">•</Text>
                <Text className="flex-1">{t(`reasons.${id}`, { defaultValue: id })}</Text>
              </View>
            ))}
          </View>
        ) : !report.explanation ? (
          <Text className="text-muted">{t('result.noFlags')}</Text>
        ) : null}
      </Section>

      <Section title={t('result.whatToDo')}>
        <Text>{report.recommendedAction || t(`result.action.${report.level}`)}</Text>
      </Section>

      <Section title={t('result.yourMessage')}>
        <HighlightedMessage text={text} flags={report.flags} />
        <Text variant="label" weight="regular" className="text-muted">
          {t('result.sources', { list: sources })}
        </Text>
      </Section>

      {scan.reportedAt ? (
        <View className="flex-row items-start gap-3 rounded-md bg-safe-container p-4">
          <CheckCircle size={22} color={safe} weight="fill" />
          <Text className="flex-1 text-on-safe-container">{t('result.reported')}</Text>
        </View>
      ) : (
        <Button
          title={t('result.reportButton')}
          icon={UsersThree}
          variant="outlined"
          onPress={() => router.push({ pathname: '/report/[id]', params: { id: scan.id } })}
        />
      )}

      <Button
        title={t('result.checkAnother')}
        variant="tonal"
        onPress={() => router.dismissTo('/')}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}
