import type { Icon } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from './text';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text';

const container: Record<Variant, string> = {
  filled: 'bg-primary',
  tonal: 'bg-primary-container',
  outlined: 'border border-outline bg-surface',
  text: 'bg-transparent',
};
const label: Record<Variant, string> = {
  filled: 'text-on-primary',
  tonal: 'text-on-primary-container',
  outlined: 'text-primary',
  text: 'text-primary',
};
const iconColorVar: Record<Variant, string> = {
  filled: '--color-on-primary',
  tonal: '--color-on-primary-container',
  outlined: '--color-primary',
  text: '--color-primary',
};

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: Icon;
  loading?: boolean;
  disabled?: boolean;
  size?: 'large' | 'medium';
  className?: string;
};

/** Material 3 button: filled (one per screen), tonal, outlined or text. Min 48dp touch target. */
export function Button({
  title,
  onPress,
  variant = 'filled',
  icon: IconCmp,
  loading = false,
  disabled = false,
  size = 'medium',
  className = '',
}: Props) {
  const iconColor = useCSSVariable(iconColorVar[variant]) as string | undefined;
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`${size === 'large' ? 'h-14' : 'h-12'} flex-row items-center justify-center gap-2 rounded-full ${variant === 'text' ? 'px-3' : 'px-6'} active:opacity-80 ${container[variant]} ${inactive ? 'opacity-50' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : IconCmp ? (
        <View accessibilityElementsHidden importantForAccessibility="no">
          <IconCmp size={20} color={iconColor} weight="bold" />
        </View>
      ) : null}
      <Text variant="label" className={`text-[15px] ${label[variant]}`}>
        {title}
      </Text>
    </Pressable>
  );
}
