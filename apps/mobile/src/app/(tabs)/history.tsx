import { router } from 'expo-router';
import { ClockCounterClockwise, Trash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';

import { RISK_STYLE } from '@/components/risk/risk-style';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Text } from '@/components/ui/text';
import { useClearHistory, useScanHistory } from '@/features/history/hooks';
import type { ScanRecord } from '@/features/history/repo';

const SafeAreaView = withUniwind(RNSafeAreaView);

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { data = [] } = useScanHistory();
  const clear = useClearHistory();

  function confirmClear() {
    Alert.alert(t('history.clearTitle'), t('history.clearBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('history.confirmDelete'), style: 'destructive', onPress: () => clear.mutate() },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-4 pb-8 pt-4"
        ListHeaderComponent={
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="headline" accessibilityRole="header">
              {t('history.title')}
            </Text>
            {data.length ? (
              <Button
                title={t('history.clear')}
                icon={Trash}
                variant="outlined"
                onPress={confirmClear}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={ClockCounterClockwise}
            title={t('history.emptyTitle')}
            body={t('history.emptyBody')}
          />
        }
        renderItem={({ item }) => <HistoryRow item={item} locale={i18n.language} />}
      />
    </SafeAreaView>
  );
}

function HistoryRow({ item, locale }: { item: ScanRecord; locale: string }) {
  const { t } = useTranslation();
  const style = RISK_STYLE[item.report.level];
  const color = useCSSVariable(style.colorVar) as string | undefined;
  const date = new Date(item.createdAt).toLocaleString(locale === 'en' ? 'en-LK' : `${locale}-LK`, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const label = t(`result.level.${item.report.level}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${item.text.slice(0, 80)}. ${date}${item.inputType === 'sms' ? `. ${t('history.fromSmsGuard')}` : ''}`}
      onPress={() => router.push({ pathname: '/result/[id]', params: { id: item.id } })}
      className="flex-row gap-3 rounded-md border border-outline-variant bg-surface p-4 active:opacity-80">
      <style.icon size={28} color={color} weight="fill" />
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="label" className={style.text}>
            {label}
          </Text>
          <Text variant="label" weight="regular" className="text-muted">
            {date}
          </Text>
        </View>
        <Text numberOfLines={2} className="text-muted">
          {item.text}
        </Text>
        {item.inputType === 'sms' ? (
          <Text variant="label" weight="regular" className="text-muted">
            {t('history.fromSmsGuard')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
