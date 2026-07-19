import { useLocalSearchParams } from 'expo-router';
import { CycleHistoryDetailScreen } from '../../src/features/cycle-history/components/CycleHistoryDetailScreen';
export default function CycleDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <CycleHistoryDetailScreen id={typeof id === 'string' ? id : ''} />;
}
