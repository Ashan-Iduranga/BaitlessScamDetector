import { ChartLineUp } from 'phosphor-react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

export default function RadarScreen() {
  return (
    <Screen>
      <Text variant="headline">Scam Radar</Text>
      <EmptyState
        icon={ChartLineUp}
        title="Coming soon"
        body="Scams that other people in Sri Lanka report will show up here, so you can spot them early."
      />
    </Screen>
  );
}
