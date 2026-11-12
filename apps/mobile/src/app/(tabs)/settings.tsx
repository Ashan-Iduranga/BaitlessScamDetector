import { LockSimple, Trash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useClearHistory } from '@/features/history/hooks';
import { LANGUAGES, setLanguage } from '@/lib/i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const clear = useClearHistory();
  const muted = useCSSVariable('--color-muted') as string | undefined;

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
