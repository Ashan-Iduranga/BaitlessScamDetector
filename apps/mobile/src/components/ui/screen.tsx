import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

// Third-party components need withUniwind before className works on them.
const SafeAreaView = withUniwind(RNSafeAreaView);

/** Standard screen: themed background, safe area at the top, 16px gutter. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-4 pb-8 pt-4">{children}</ScrollView>
    </SafeAreaView>
  );
}
