import { router } from 'expo-router';
import {
  CaretRight,
  GearSix,
  LockSimple,
  ShieldCheck,
  Trash,
  UsersThree,
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SwitchRow } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useClearHistory } from '@/features/history/hooks';
import { useSmsGuard } from '@/features/sms-guard/use-sms-guard';
import { LANGUAGES, setLanguage } from '@/lib/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const clear = useClearHistory();
  const smsGuard = useSmsGuard();
  const [muted, primary] = useCSSVariable(['--color-muted', '--color-primary']) as (
    string | undefined
  )[];

  function confirmClear() {
    Alert.alert(t('history.clearTitle'), t('history.clearBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('history.confirmDelete'), style: 'destructive', onPress: () => clear.mutate() },
    ]);
  }

  return (
    <Screen>
      <Text variant="headline" accessibilityRole="header">
        {t('settings.title')}
      </Text>

      <View className="gap-3">
        <Text variant="title">{t('settings.language')}</Text>
        {/* Material 3 segmented button */}
        <View
          accessibilityRole="radiogroup"
          className="flex-row overflow-hidden rounded-full border border-outline">
          {LANGUAGES.map(({ code, label }, i) => {
            const selected = i18n.language === code;
            return (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setLanguage(code)}
                className={`h-12 flex-1 items-center justify-center ${i > 0 ? 'border-l border-outline' : ''} ${selected ? 'bg-primary-container' : 'bg-surface'}`}>
                <Text
                  variant="label"
                  className={selected ? 'text-on-primary-container' : 'text-foreground'}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="label" weight="regular" className="text-muted">
          {t('settings.languageHint')}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('settings.familyBody')}
        onPress={() => router.push('/family')}
        className="flex-row items-center gap-3 rounded-md border border-outline-variant bg-surface p-4 active:bg-surface-container-high">
        <UsersThree size={24} color={primary} />
        <View className="flex-1 gap-1">
          <Text variant="title">{t('settings.familyTitle')}</Text>
          <Text className="text-muted">{t('settings.familyBody')}</Text>
        </View>
        <CaretRight size={20} color={muted} />
      </Pressable>

      {smsGuard.available ? (
        <View className="gap-3 rounded-md border border-outline-variant bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={20} color={primary} />
            <Text variant="label" className="text-muted">
              {t('smsGuard.title')}
            </Text>
          </View>
          <SwitchRow
            label={t('smsGuard.switch')}
            description={t('smsGuard.body')}
            value={smsGuard.enabled}
            disabled={smsGuard.busy}
            onChange={(on) => void smsGuard.setEnabled(on)}
          />
          {smsGuard.denied ? (
            <View accessibilityLiveRegion="polite" className="gap-3">
              <Text className="text-danger">
                {t(smsGuard.blocked ? 'smsGuard.blocked' : 'smsGuard.denied')}
              </Text>
              {smsGuard.blocked ? (
                <Button
                  title={t('smsGuard.openSettings')}
                  icon={GearSix}
                  variant="outlined"
                  onPress={() => void Linking.openSettings()}
                />
              ) : null}
            </View>
          ) : null}
          <Text variant="label" weight="regular" className="text-muted">
            {t('smsGuard.privacy')}
          </Text>
        </View>
      ) : null}

      <View className="gap-3 rounded-md border border-outline-variant bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <LockSimple size={20} color={muted} />
          <Text variant="title">{t('settings.privacyTitle')}</Text>
        </View>
        <Text className="text-muted">{t('settings.privacyBody')}</Text>
      </View>

      <Button
        title={t('settings.deleteHistory')}
        icon={Trash}
        variant="outlined"
        onPress={confirmClear}
      />
    </Screen>
  );
}
