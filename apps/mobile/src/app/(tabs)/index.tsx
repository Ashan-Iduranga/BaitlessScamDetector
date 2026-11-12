import * as Clipboard from 'expo-clipboard';
import { useShareIntentContext } from 'expo-share-intent';
import { ClipboardText, Image as ImageIcon, LockSimple, ShieldCheck } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import {
  looksReadable,
  MIN_READ_LENGTH,
  pickScreenshot,
  readImageOnline,
  recognizeImage,
  type OnlineReadResult,
} from '@/features/scan/read-image';
import { useScan } from '@/features/scan/use-scan';
import { currentLanguage } from '@/lib/i18n';

const MAX_LENGTH = 5000;

export default function ScanScreen() {
  const { t } = useTranslation();
  const [muted] = useCSSVariable(['--color-muted']) as (string | undefined)[];
  const [text, setText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [reading, setReading] = useState<'device' | 'online' | null>(null);
  // The last screenshot read on the phone, so people can retry it online if the text is wrong.
  const [deviceReadImage, setDeviceReadImage] = useState<string | null>(null);
  const scan = useScan();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  // A message shared from WhatsApp/SMS lands here: fill the box, or read a shared screenshot.
  // Syncing an external event (the native share intent) into state is what effects are for.
  useEffect(() => {
    if (!hasShareIntent) return;
    const shared = shareIntent.text ?? shareIntent.webUrl;
    const image = shareIntent.files?.find((f) => f.mimeType?.startsWith('image/'));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (shared) setText(shared.slice(0, MAX_LENGTH));
    else if (image) void readImage(image.path);
    resetShareIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

  // ML Kit on the phone reads English letters only. When it finds little, or the app is in
  // Sinhala/Tamil, offer the online reader. The picture is sent as it is, so always ask first.
  async function readImage(uri: string) {
    setNotice(null);
    setDeviceReadImage(null);
    setReading('device');
    let found = '';
    try {
      found = await recognizeImage(uri);
    } catch {
      // Fall through: the online reader may still work.
    } finally {
      setReading(null);
    }
    const foundEnough = looksReadable(found);
    if (foundEnough && currentLanguage() === 'en') {
      applyDeviceText(found, uri);
      return;
    }
    askToReadOnline(uri, foundEnough ? found : null);
  }

  function applyDeviceText(found: string, uri: string) {
    setText(found.slice(0, MAX_LENGTH));
    setDeviceReadImage(uri);
  }

  function askToReadOnline(uri: string, deviceText: string | null) {
    Alert.alert(
      t('scan.online.title'),
      t('scan.online.body'),
      [
        { text: t('scan.online.cancel'), style: 'cancel' },
        ...(deviceText
          ? [{ text: t('scan.online.useLocal'), onPress: () => applyDeviceText(deviceText, uri) }]
          : []),
        { text: t('scan.online.send'), onPress: () => void readOnline(uri) },
      ],
      { cancelable: true },
    );
  }

  async function readOnline(uri: string) {
    setNotice(null);
    setDeviceReadImage(null);
    setReading('online');
    const result = await readImageOnline(uri);
    setReading(null);
    if (result.ok && result.text.length >= MIN_READ_LENGTH)
      setText(result.text.slice(0, MAX_LENGTH));
    else setNotice(onlineNotice(result));
  }

  function onlineNotice(result: OnlineReadResult): string {
    if (result.ok) return t('scan.ocrNoText');
    switch (result.reason) {
      case 'offline':
        return t('scan.online.offline');
      case 'rate_limited':
        return t('scan.online.limited');
      case 'unavailable':
        return t('scan.online.unavailable');
      default:
        return t('scan.online.failed');
    }
  }

  async function onPaste() {
    setNotice(null);
    setDeviceReadImage(null);
    const copied = await Clipboard.getStringAsync();
    if (copied.trim()) setText(copied.slice(0, MAX_LENGTH));
    else setNotice(t('scan.clipboardEmpty'));
  }

  async function onPickImage() {
    const uri = await pickScreenshot();
    if (uri) await readImage(uri);
  }

  const canCheck = text.trim().length > 0 && !scan.isPending && !reading;

  return (
    <Screen>
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('scan.title')}
        </Text>
        <Text className="text-muted">{t('scan.intro')}</Text>
      </View>

      <View className="gap-3">
        <TextInput
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setNotice(null);
            setDeviceReadImage(null);
          }}
          maxLength={MAX_LENGTH}
          accessibilityLabel={t('scan.placeholder')}
          placeholder={t('scan.placeholder')}
          placeholderTextColor={muted}
          className="min-h-44 rounded-md border border-outline bg-surface p-4 font-latin text-body text-foreground"
          textAlignVertical="top"
        />
        <View className="flex-row gap-3">
          <Button
            title={t('scan.paste')}
            icon={ClipboardText}
            variant="outlined"
            onPress={onPaste}
            className="flex-1"
          />
          <Button
            title={
              reading === 'online'
                ? t('scan.online.reading')
                : reading === 'device'
                  ? t('scan.readingImage')
                  : t('scan.screenshot')
            }
            icon={ImageIcon}
            variant="outlined"
            onPress={onPickImage}
            loading={reading !== null}
            className="flex-1"
          />
        </View>
        {deviceReadImage ? (
          <Button
            title={t('scan.online.retry')}
            variant="tonal"
            onPress={() => askToReadOnline(deviceReadImage, null)}
          />
        ) : null}
        {notice ? (
          <Text accessibilityLiveRegion="polite" className="text-caution">
            {notice}
          </Text>
        ) : null}
      </View>

      <Button
        title={scan.isPending ? t('scan.checking') : t('scan.check')}
        icon={ShieldCheck}
        size="large"
        loading={scan.isPending}
        disabled={!canCheck}
        onPress={() => scan.mutate({ text, inputType: 'paste' })}
      />

      <View className="flex-row items-start gap-3 rounded-md bg-surface-container p-4">
        <LockSimple size={20} color={muted} />
        <Text variant="label" weight="regular" className="flex-1 text-muted">
          {t('scan.privacyNote')}
        </Text>
      </View>
    </Screen>
  );
}
