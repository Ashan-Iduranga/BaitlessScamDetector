import type { Icon } from 'phosphor-react-native';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from './text';

type Props = { icon: Icon; title: string; body: string };

/** Empty state that tells the user what to do next. */
export function EmptyState({ icon: IconCmp, title, body }: Props) {
  const muted = useCSSVariable('--color-muted') as string | undefined;
  return (
    <View className="items-center gap-3 rounded-md border border-outline-variant bg-surface px-6 py-10">
      <IconCmp size={40} color={muted} weight="duotone" />
      <Text variant="title" className="text-center">
        {title}
      </Text>
      <Text className="text-center text-muted">{body}</Text>
    </View>
  );
}
