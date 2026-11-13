import { defang } from '@baitless/detector';
import { router, useFocusEffect } from 'expo-router';
import { ArrowClockwise, Heart, ShieldCheck, UserMinus, UserPlus } from 'phosphor-react-native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { RISK_STYLE } from '@/components/risk/risk-style';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { FamilyLink, GuardianAlert } from '@/features/family/api';
import { familyFailure } from '@/features/family/api';
import { useFamily, useGuardianAlerts, useRemoveLink } from '@/features/family/hooks';
import { markAlertsSeen, nameFor, scamTypeLabel } from '@/features/family/notify';

export default function FamilyScreen() {
  const { t } = useTranslation();
  const family = useFamily(true);
  const lookingAfter = family.data?.lookingAfter ?? [];
  const guardians = family.data?.guardians ?? [];
  const alerts = useGuardianAlerts(family.data?.me, lookingAfter.length > 0);
  const primary = useCSSVariable('--color-primary') as string | undefined;
  const { refetch: refetchFamily } = family;
  const { refetch: refetchAlerts, data: alertList } = alerts;

  useFocusEffect(
    useCallback(() => {
      void refetchFamily();
    }, [refetchFamily]),
  );

  // Seeing the list counts as being told, so the background check does not repeat them.
  useEffect(() => {
    if (alertList) markAlertsSeen(alertList);
  }, [alertList]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-10 pt-2"
      refreshControl={
        <RefreshControl
          refreshing={family.isRefetching || alerts.isRefetching}
          onRefresh={() => {
            void refetchFamily();
            void refetchAlerts();
          }}
          colors={primary ? [primary] : undefined}
        />
      }>
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('family.title')}
        </Text>
        <Text className="text-muted">{t('family.intro')}</Text>
      </View>

      {family.isPending ? (
        <ActivityIndicator color={primary} className="py-10" />
      ) : family.isError ? (
        <View className="gap-3 rounded-md bg-surface-container p-4">
          <Text accessibilityLiveRegion="polite">
            {t(`family.error.${familyFailure(family.error)}`)}
          </Text>
          <Button
            title={t('family.retry')}
            icon={ArrowClockwise}
            variant="outlined"
            onPress={() => void refetchFamily()}
          />
        </View>
      ) : (
        <>
          {lookingAfter.length ? (
            <Section title={t('family.alertsTitle')} subtitle={t('family.alertsSubtitle')}>
              {alertList?.length ? (
                alertList.map((a) => <AlertRow key={a.id} alert={a} links={lookingAfter} />)
              ) : (
                <View className="rounded-md bg-surface-container p-4">
                  <Text className="text-muted">{t('family.noAlerts')}</Text>
                </View>
              )}
            </Section>
          ) : null}

          <Section title={t('family.lookingAfterTitle')} subtitle={t('family.lookingAfterBody')}>
            {lookingAfter.map((l) => (
              <PersonRow key={l.id} link={l} name={l.protected_name} role="guardian" />
            ))}
            <Button
              title={t('family.join')}
              icon={UserPlus}
              variant={lookingAfter.length ? 'outlined' : 'tonal'}
              onPress={() => router.push('/family/join')}
            />
          </Section>

          <Section title={t('family.guardiansTitle')} subtitle={t('family.guardiansBody')}>
            {guardians.map((l) => (
              <PersonRow key={l.id} link={l} name={l.guardian_name} role="protected" />
            ))}
            <Button
              title={t('family.share')}
              icon={Heart}
              variant={guardians.length ? 'outlined' : 'tonal'}
              onPress={() => router.push('/family/share')}
            />
          </Section>
        </>
      )}

      <View className="flex-row items-start gap-3 rounded-md border border-outline-variant bg-surface p-4">
        <ShieldCheck size={22} color={primary} />
        <Text className="flex-1 text-muted">{t('family.privacy')}</Text>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Text className="text-muted">{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function AlertRow({ alert, links }: { alert: GuardianAlert; links: FamilyLink[] }) {
  const { t, i18n } = useTranslation();
  const style = RISK_STYLE[alert.level];
  const color = useCSSVariable(style.colorVar) as string | undefined;
  const name = nameFor(links, alert.protected_id, t('family.someone'));
  const when = new Date(alert.created_at).toLocaleString(
    i18n.language === 'en' ? 'en-LK' : `${i18n.language}-LK`,
    { dateStyle: 'medium', timeStyle: 'short' },
  );
  const level = t(`result.level.${alert.level}`);
  const type = scamTypeLabel(t, alert.category);

  return (
    <View
      accessible
      accessibilityLabel={`${name}. ${level}. ${type}. ${t(`family.source.${alert.source}`)}. ${when}`}
      className="flex-row gap-3 rounded-md border border-outline-variant bg-surface p-4">
      <style.icon size={26} color={color} weight="fill" />
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-baseline justify-between gap-2">
          <Text weight="semibold">{name}</Text>
          <Text variant="label" weight="regular" className="text-muted">
            {when}
          </Text>
        </View>
        <Text variant="label" className={style.text}>
          {level} · {type}
        </Text>
        <Text className="text-muted">{t(`family.source.${alert.source}`)}</Text>
        {alert.link ? (
          <Text weight="semibold" selectable={false}>
            {defang(alert.link)}
          </Text>
        ) : null}
        <Text variant="label" weight="regular" className="text-muted">
          {t('family.advice', { name })}
        </Text>
      </View>
    </View>
  );
}

function PersonRow({
  link,
  name,
  role,
}: {
  link: FamilyLink;
  name: string;
  /** "guardian": I look after them. "protected": they look after me. */
  role: 'guardian' | 'protected';
}) {
  const { t } = useTranslation();
  const remove = useRemoveLink();
  const muted = useCSSVariable('--color-muted') as string | undefined;

  function confirmRemove() {
    Alert.alert(
      t(`family.remove.${role}.title`, { name }),
      t(`family.remove.${role}.body`, { name }),
      [
        { text: t('family.remove.cancel'), style: 'cancel' },
        {
          text: t('family.remove.confirm'),
          style: 'destructive',
          onPress: () => remove.mutate(link.id),
        },
      ],
    );
  }

  return (
    <View className="min-h-14 flex-row items-center gap-3 rounded-md border border-outline-variant bg-surface px-4 py-2">
      <Heart size={20} color={muted} />
      <Text className="flex-1" weight="semibold">
        {name}
      </Text>
      <Button
        title={t('family.remove.button')}
        icon={UserMinus}
        variant="text"
        loading={remove.isPending}
        onPress={confirmRemove}
      />
    </View>
  );
}
