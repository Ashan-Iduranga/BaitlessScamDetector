import {
  ArrowClockwise,
  ChartLineUp,
  GearSix,
  Minus,
  TrendDown,
  TrendUp,
  type Icon,
} from 'phosphor-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';

import { CategoryBars } from '@/components/radar/category-bars';
import { DailyBars } from '@/components/radar/daily-bars';
import { TrendingList } from '@/components/radar/trending-list';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SwitchRow } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { hasRadarData, type RadarSummary } from '@/features/radar/api';
import { useRadar, useRadarAlerts } from '@/features/radar/hooks';
import { lastSeenConfirmedAt, markSeen, newestConfirmed } from '@/features/radar/seen';

const SafeAreaView = withUniwind(RNSafeAreaView);

export default function RadarScreen() {
  const { t, i18n } = useTranslation();
  const radar = useRadar();
  const primary = useCSSVariable('--color-primary') as string | undefined;
  // What counted as "seen" when the screen opened, so "New" badges stay while the user looks.
  const [seenBefore] = useState(lastSeenConfirmedAt);
  const trending = radar.data?.trending;

  // Opening Scam Radar shows the user every confirmed scam, so no alert is needed for them.
  useEffect(() => {
    if (trending) markSeen(newestConfirmed(trending));
  }, [trending]);

  const updated = radar.data
    ? new Date(radar.data.generatedAt).toLocaleTimeString(
        i18n.language === 'en' ? 'en-LK' : `${i18n.language}-LK`,
        { hour: 'numeric', minute: '2-digit' },
      )
    : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-6 px-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={radar.isRefetching}
            onRefresh={() => void radar.refetch()}
            colors={primary ? [primary] : undefined}
          />
        }>
        <View className="gap-2">
          <Text variant="headline" accessibilityRole="header">
            {t('radar.title')}
          </Text>
          <Text className="text-muted">{t('radar.intro')}</Text>
          {updated ? (
            <Text variant="label" weight="regular" className="text-muted">
              {t('radar.updated', { time: updated })}
            </Text>
          ) : null}
        </View>

        <AlertsCard />

        {radar.isPending ? (
          <ActivityIndicator color={primary} className="py-10" />
        ) : radar.isError ? (
          <View className="gap-3 rounded-md bg-surface-container p-4">
            <Text accessibilityLiveRegion="polite">{t('radar.error')}</Text>
            <Button
              title={t('radar.retry')}
              icon={ArrowClockwise}
              variant="outlined"
              onPress={() => void radar.refetch()}
            />
          </View>
        ) : hasRadarData(radar.data) ? (
          <RadarBody summary={radar.data} newSince={seenBefore} />
        ) : (
          <EmptyState
            icon={ChartLineUp}
            title={t('radar.emptyTitle')}
            body={t('radar.emptyBody')}
          />
        )}

        <Text variant="label" weight="regular" className="text-muted">
          {t('radar.footnote')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RadarBody({ summary, newSince }: { summary: RadarSummary; newSince: number }) {
  const { t } = useTranslation();
  const diff = summary.thisWeek - summary.lastWeek;
  const change =
    diff > 0
      ? { icon: TrendUp, text: t('radar.change.up', { n: diff }) }
      : diff < 0
        ? { icon: TrendDown, text: t('radar.change.down', { n: -diff }) }
        : { icon: Minus, text: t('radar.change.same') };

  return (
    <>
      <View className="flex-row gap-3">
        <StatTile
          label={t('radar.thisWeek')}
          value={summary.thisWeek}
          note={change.text}
          noteIcon={change.icon}
        />
        <StatTile
          label={t('radar.confirmed')}
          value={summary.confirmedTotal}
          note={t('radar.confirmedHint')}
        />
      </View>

      <Section title={t('radar.daily.title')} subtitle={t('radar.daily.subtitle')}>
        <DailyBars days={summary.daily} />
      </Section>

      {summary.categories.length ? (
        <Section title={t('radar.types.title')} subtitle={t('radar.types.subtitle')}>
          <CategoryBars rows={summary.categories} />
        </Section>
      ) : null}

      <View className="gap-3">
        <View className="gap-1">
          <Text variant="title" accessibilityRole="header">
            {t('radar.trending.title')}
          </Text>
          <Text className="text-muted">{t('radar.trending.subtitle')}</Text>
        </View>
        {summary.trending.length ? (
          <TrendingList items={summary.trending} newSince={newSince} />
        ) : (
          <View className="rounded-md bg-surface-container p-4">
            <Text className="text-muted">{t('radar.trending.none')}</Text>
          </View>
        )}
      </View>
    </>
  );
}

function StatTile({
  label,
  value,
  note,
  noteIcon: NoteIcon,
}: {
  label: string;
  value: number;
  note: string;
  noteIcon?: Icon;
}) {
  const muted = useCSSVariable('--color-muted') as string | undefined;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${note}`}
      className="flex-1 gap-1 rounded-md border border-outline-variant bg-surface p-4">
      <Text variant="label" weight="regular" className="text-muted">
        {label}
      </Text>
      <Text variant="display">{value}</Text>
      <View className="flex-row items-start gap-1">
        {NoteIcon ? <NoteIcon size={16} color={muted} /> : null}
        <Text variant="label" weight="regular" className="flex-1 text-muted">
          {note}
        </Text>
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-4 rounded-md border border-outline-variant bg-surface p-4">
      <View className="gap-1">
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="label" weight="regular" className="text-muted">
          {subtitle}
        </Text>
      </View>
      {children}
    </View>
  );
}

function AlertsCard() {
  const { t } = useTranslation();
  const alerts = useRadarAlerts();
  if (!alerts.available) return null;

  return (
    <View className="gap-3 rounded-md border border-outline-variant bg-surface p-4">
      <SwitchRow
        label={t('radar.alerts.title')}
        description={t('radar.alerts.body')}
        value={alerts.enabled}
        disabled={alerts.busy}
        onChange={(on) => void alerts.setEnabled(on)}
      />
      {alerts.problem ? (
        <View accessibilityLiveRegion="polite" className="gap-3">
          <Text className="text-danger">{t(`radar.alerts.${alerts.problem}`)}</Text>
          {alerts.problem === 'blocked' ? (
            <Button
              title={t('radar.alerts.openSettings')}
              icon={GearSix}
              variant="outlined"
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
