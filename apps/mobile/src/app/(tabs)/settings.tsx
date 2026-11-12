import { Gear } from 'phosphor-react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

export default function SettingsScreen() {
  return (
    <Screen>
      <Text variant="headline">Settings</Text>
      <EmptyState
        icon={Gear}
        title="Nothing to set yet"
        body="Language, SMS Guard and family settings will be added here."
      />
    </Screen>
  );
}
