import { ClockCounterClockwise } from 'phosphor-react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

export default function HistoryScreen() {
  return (
    <Screen>
      <Text variant="headline">History</Text>
      <EmptyState
        icon={ClockCounterClockwise}
        title="No checks yet"
        body="Messages you check are saved here on your phone, so you can look at them again later."
      />
    </Screen>
  );
}
