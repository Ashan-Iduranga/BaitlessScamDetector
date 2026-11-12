import { Pressable, TextInput, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

// Phase 0 shell. The scan pipeline is wired up in Phase 1.
export default function ScanScreen() {
  const muted = useCSSVariable('--color-muted') as string | undefined;
  return (
    <Screen>
      <View className="gap-2">
        <Text variant="headline">Check a message</Text>
        <Text className="text-muted">
          Paste a message, link or phone number you are not sure about. We will tell you if it looks
          like a scam and why.
        </Text>
      </View>

      <TextInput
        multiline
        accessibilityLabel="Message to check"
        placeholder="Paste the message here"
        placeholderTextColor={muted}
        className="min-h-40 rounded-md border border-outline bg-surface p-4 font-latin text-body text-foreground"
        textAlignVertical="top"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        disabled
        className="h-14 items-center justify-center rounded-full bg-primary opacity-40">
        <Text variant="label" className="text-on-primary">
          Check message
        </Text>
      </Pressable>

      {/* Script rendering check: these must render in the Sinhala and Tamil fonts. */}
      <View className="gap-1 rounded-md border border-outline-variant bg-surface-container p-4">
        <Text variant="label" className="text-muted">
          Works in your language
        </Text>
        <Text>පණිවිඩය පරීක්ෂා කරන්න</Text>
        <Text>செய்தியைச் சரிபார்க்கவும்</Text>
      </View>
    </Screen>
  );
}
