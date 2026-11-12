import { Pressable, View } from 'react-native';

import { Text } from './text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  /** Read out by screen readers as the group's name. */
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Material 3 radio group: whole row is the touch target (min 48dp), 20dp circle. */
export function RadioGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="gap-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-12 flex-row items-center gap-4 rounded-md px-3 active:bg-surface-container-high ${selected ? 'bg-surface-container' : ''}`}>
            <View
              className={`size-5 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-outline'}`}>
              {selected ? <View className="size-2.5 rounded-full bg-primary" /> : null}
            </View>
            <Text className="flex-1">{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
