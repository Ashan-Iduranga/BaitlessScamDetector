import { extractPhones, reportableIndicators } from '@baitless/detector';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import {
  CheckCircle,
  Globe,
  LinkSimple,
  Phone,
  ShareNetwork,
  ShieldWarning,
  UsersThree,
} from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Share, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/text';
import {
  authorityReportText,
  CERT_HOTLINE,
  CERT_REPORT_URL,
  REPORT_CATEGORIES,
  reportFailure,
  useSubmitReport,
  type ReportCategory,
} from '@/features/community/report';
import { useScan } from '@/features/history/hooks';

export default function ReportScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: scan } = useScan(id);
  const submit = useSubmitReport();
  const [muted, safe, caution] = useCSSVariable([
    '--color-muted',
    '--color-safe',
    '--color-on-caution-container',
  ]) as (string | undefined)[];
  const [category, setCategory] = useState<ReportCategory | null>(null);

  if (!scan) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted">{t('result.notFound')}</Text>
      </View>
    );
  }

  const { domains, urls } = reportableIndicators(scan.text);
  const phones = [...new Set(extractPhones(scan.text).map((p) => p.raw.trim()))];
  const canReport = domains.length + urls.length + phones.length > 0;
  const chosen: ReportCategory =
    category ?? (scan.report.category === 'none' ? 'other' : scan.report.category);
  const reported = scan.reportedAt !== null || submit.isSuccess;
  const failure = submit.isError ? reportFailure(submit.error) : null;

  const reportText = authorityReportText(scan, t(`result.category.${chosen}`));

  async function openCert() {
    // The portal has its own form: copy our summary so people can paste it in.
    await Clipboard.setStringAsync(reportText);
    await Linking.openURL(CERT_REPORT_URL);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pb-10 pt-2">
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('report.title')}
        </Text>
        <Text className="text-muted">{t('report.intro')}</Text>
      </View>

      {canReport ? (
        <View className="gap-3 rounded-lg border border-outline-variant bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <UsersThree size={20} color={muted} />
            <Text variant="label">{t('report.shared')}</Text>
          </View>
          {domains.map((d) => (
            <Indicator key={d} icon={<Globe size={18} color={muted} />} text={d} />
          ))}
          {urls.map((u) => (
            <Indicator key={u} icon={<LinkSimple size={18} color={muted} />} text={u} />
          ))}
          {phones.map((p) => (
            <Indicator
              key={p}
              icon={<Phone size={18} color={muted} />}
              text={p}
              note={t('report.phoneHashed')}
            />
          ))}
          <Text variant="label" weight="regular" className="text-muted">
            {t('report.confirmRule')}
          </Text>
        </View>
      ) : (
        <View className="rounded-md bg-surface-container p-4">
          <Text className="text-muted">{t('report.nothingToShare')}</Text>
        </View>
      )}

      {canReport && !reported ? (
        <View className="gap-3">
          <Text variant="title" accessibilityRole="header">
            {t('report.whatKind')}
          </Text>
          <RadioGroup
            label={t('report.whatKind')}
            value={chosen}
            onChange={setCategory}
            options={REPORT_CATEGORIES.map((c) => ({ value: c, label: t(`result.category.${c}`) }))}
          />
          {failure ? (
            <Text accessibilityLiveRegion="polite" className="text-danger">
              {t(`report.error.${failure}`)}
            </Text>
          ) : null}
          <Button
            title={t('report.send')}
            icon={UsersThree}
            size="large"
            loading={submit.isPending}
            onPress={() => submit.mutate({ scan, category: chosen })}
          />
        </View>
      ) : null}

      {reported ? (
        <View
          accessibilityLiveRegion="polite"
          className="flex-row items-start gap-3 rounded-md bg-safe-container p-4">
          <CheckCircle size={22} color={safe} weight="fill" />
          <Text className="flex-1 text-on-safe-container">{t('report.thanks')}</Text>
        </View>
      ) : null}

      <View className="gap-3">
        <Text variant="title" accessibilityRole="header">
          {t('report.authorities')}
        </Text>
        <View className="flex-row items-start gap-3 rounded-md bg-caution-container p-4">
          <ShieldWarning size={22} color={caution} />
          <Text className="flex-1 text-on-caution-container">{t('report.lostMoney')}</Text>
        </View>
        <Text className="text-muted">{t('report.certHelp')}</Text>
        <Button
          title={t('report.openCert')}
          icon={Globe}
          variant="tonal"
          onPress={() => void openCert()}
        />
        <Button
          title={t('report.shareText')}
          icon={ShareNetwork}
          variant="outlined"
          onPress={() => void Share.share({ message: reportText, title: t('report.title') })}
        />
        <Button
          title={t('report.callCert', { number: CERT_HOTLINE })}
          icon={Phone}
          variant="outlined"
          onPress={() => void Linking.openURL(`tel:${CERT_HOTLINE}`)}
        />
      </View>
    </ScrollView>
  );
}

function Indicator({ icon, text, note }: { icon: React.ReactNode; text: string; note?: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="pt-1">{icon}</View>
      <View className="flex-1">
        <Text selectable>{text}</Text>
        {note ? (
          <Text variant="label" weight="regular" className="text-muted">
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
