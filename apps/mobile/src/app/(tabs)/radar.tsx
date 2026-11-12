import { ChartLineUp } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

export default function RadarScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="headline" accessibilityRole="header">
        {t('radar.title')}
      </Text>
      <EmptyState icon={ChartLineUp} title={t('radar.comingTitle')} body={t('radar.comingBody')} />
    </Screen>
  );
}
