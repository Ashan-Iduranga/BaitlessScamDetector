import * as Clipboard from 'expo-clipboard';
import { Copy, Heart, ShareNetwork } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { familyFailure } from '@/features/family/api';
import { useCreateInvite } from '@/features/family/hooks';
import { SmsGuard } from '@/features/sms-guard/native';

/** "XKBV3MC5" → "XKBV-3MC5", easier to read out over the phone. */
const pretty = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

/** The protected person creates a code. Creating it is their consent to be looked after. */
export default function ShareScreen() {
  const { t, i18n } = useTranslation();
  const create = useCreateInvite();
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const invite = create.data;

  const until = invite
    ? new Date(invite.expiresAt).toLocaleString(
        i18n.language === 'en' ? 'en-LK' : `${i18n.language}-LK`,
        { dateStyle: 'medium', timeStyle: 'short' },
      )
    : '';
  const shareText = invite ? t('family.shareScreen.message', { code: pretty(invite.code) }) : '';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pb-10 pt-2">
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('family.shareScreen.title')}
        </Text>
        <Text className="text-muted">{t('family.shareScreen.intro')}</Text>
      </View>

      <View className="gap-2 rounded-md border border-outline-variant bg-surface p-4">
        <Text variant="title">{t('family.shareScreen.theySee')}</Text>
        {(['level', 'type', 'when', 'link'] as const).map((k) => (
          <View key={k} className="flex-row gap-2">
            <Text className="text-muted">•</Text>
            <Text className="flex-1 text-muted">{t(`family.shareScreen.see.${k}`)}</Text>
          </View>
        ))}
        <Text weight="semibold">{t('family.shareScreen.never')}</Text>
      </View>

      {invite ? (
        <View className="gap-4">
          <View
            accessible
            accessibilityLabel={t('family.shareScreen.codeLabel', {
              code: invite.code.split('').join(' '),
            })}
            className="items-center gap-2 rounded-lg bg-primary-container px-4 py-6">
            <Text variant="label" className="text-on-primary-container">
              {t('family.shareScreen.yourCode')}
            </Text>
            <Text variant="display" className="tracking-widest text-on-primary-container">
              {pretty(invite.code)}
            </Text>
            <Text variant="label" weight="regular" className="text-on-primary-container">
              {t('family.shareScreen.validUntil', { time: until })}
            </Text>
          </View>
          <Text className="text-muted">{t('family.shareScreen.next')}</Text>
          <Button
            title={t('family.shareScreen.shareCode')}
            icon={ShareNetwork}
            onPress={() => void Share.share({ message: shareText })}
          />
          <Button
            title={copied ? t('family.shareScreen.copied') : t('family.shareScreen.copy')}
            icon={Copy}
            variant="outlined"
            onPress={() => {
              void Clipboard.setStringAsync(pretty(invite.code)).then(() => setCopied(true));
            }}
          />
          {SmsGuard && !SmsGuard.isEnabled() ? (
            <View className="rounded-md bg-caution-container p-4">
              <Text className="text-on-caution-container">
                {t('family.shareScreen.smsGuardTip')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="gap-4">
          <TextField
            label={t('family.shareScreen.nameLabel')}
            hint={t('family.shareScreen.nameHint')}
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
          />
          {create.isError ? (
            <Text accessibilityLiveRegion="polite" className="text-danger">
              {t(`family.error.${familyFailure(create.error)}`)}
            </Text>
          ) : null}
          <Button
            title={t('family.shareScreen.create')}
            icon={Heart}
            size="large"
            disabled={!name.trim()}
            loading={create.isPending}
            onPress={() => create.mutate(name)}
          />
        </View>
      )}
    </ScrollView>
  );
}
