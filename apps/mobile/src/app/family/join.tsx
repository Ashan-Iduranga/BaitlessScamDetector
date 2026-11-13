import { router } from 'expo-router';
import { CheckCircle, UserPlus } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { familyFailure } from '@/features/family/api';
import { useAcceptInvite } from '@/features/family/hooks';

/** The guardian enters the code the protected person gave them. */
export default function JoinScreen() {
  const { t } = useTranslation();
  const accept = useAcceptInvite();
  const safe = useCSSVariable('--color-safe') as string | undefined;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const cleanCode = code.replace(/[\s-]/g, '');
  const ready = cleanCode.length === 8 && name.trim().length > 0;

  if (accept.isSuccess) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pb-10 pt-2">
        <View
          accessibilityLiveRegion="polite"
          className="flex-row items-start gap-3 rounded-md bg-safe-container p-4">
          <CheckCircle size={24} color={safe} weight="fill" />
          <View className="flex-1 gap-1">
            <Text weight="semibold" className="text-on-safe-container">
              {t('family.joinScreen.doneTitle', { name: accept.data })}
            </Text>
            <Text className="text-on-safe-container">
              {t('family.joinScreen.doneBody', { name: accept.data })}
            </Text>
          </View>
        </View>
        <Button title={t('family.joinScreen.back')} onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-10 pt-2"
      keyboardShouldPersistTaps="handled">
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('family.joinScreen.title')}
        </Text>
        <Text className="text-muted">{t('family.joinScreen.intro')}</Text>
      </View>

      <TextField
        label={t('family.joinScreen.codeLabel')}
        hint={t('family.joinScreen.codeHint')}
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        maxLength={9}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        inputClassName="tracking-widest"
      />
      <TextField
        label={t('family.joinScreen.nameLabel')}
        hint={t('family.joinScreen.nameHint')}
        value={name}
        onChangeText={setName}
        maxLength={40}
        autoCapitalize="words"
      />
      {accept.isError ? (
        <Text accessibilityLiveRegion="polite" className="text-danger">
          {t(`family.error.${familyFailure(accept.error)}`)}
        </Text>
      ) : null}
      <Button
        title={t('family.joinScreen.submit')}
        icon={UserPlus}
        size="large"
        disabled={!ready}
        loading={accept.isPending}
        onPress={() => accept.mutate({ code: cleanCode, name })}
      />
    </ScrollView>
  );
}
