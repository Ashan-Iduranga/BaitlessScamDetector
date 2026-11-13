import { Pressable, View } from 'react-native';

import { Text } from './text';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

/**
 * Material 3 switch in a list row. The whole row is the touch target. The track is 52×32dp; the
 * handle is 16dp when off and 24dp when on.
 */
export function SwitchRow({ label, description, value, onChange, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      className={`min-h-14 flex-row items-center gap-4 rounded-md py-2 active:bg-surface-container-high ${disabled ? 'opacity-60' : ''}`}>
      <View className="flex-1 gap-1">
        <Text variant="title">{label}</Text>
        {description ? <Text className="text-muted">{description}</Text> : null}
      </View>
      <View
        className={`h-8 w-13 flex-row items-center rounded-full border-2 px-1 ${value ? 'justify-end border-primary bg-primary' : 'justify-start border-outline bg-surface-container-high'}`}>
        <View
          className={
            value ? 'size-6 rounded-full bg-on-primary' : 'ml-1 size-4 rounded-full bg-outline'
          }
        />
      </View>
    </Pressable>
  );
}
