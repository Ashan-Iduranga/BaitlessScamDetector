import { TextInput, View, type TextInputProps } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from './text';

type Props = Omit<TextInputProps, 'className'> & {
  label: string;
  /** Shown under the field; replaced by `error` when there is one. */
  hint?: string;
  error?: string | null;
  inputClassName?: string;
};

/** Material 3 outlined text field: label above, 56dp field, hint or error below. */
export function TextField({ label, hint, error, inputClassName = '', ...input }: Props) {
  const muted = useCSSVariable('--color-muted') as string | undefined;
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={muted}
        className={`min-h-14 rounded-md border bg-surface px-4 font-latin text-body text-foreground ${error ? 'border-danger' : 'border-outline'} ${inputClassName}`}
        {...input}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          variant="label"
          weight="regular"
          className="text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="label" weight="regular" className="text-muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
