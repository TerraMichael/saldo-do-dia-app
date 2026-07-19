import { useLocalSearchParams } from 'expo-router';

import { EditExpenseScreen } from '../src/features/expenses/components/EditExpenseScreen';

export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return <EditExpenseScreen id={typeof id === 'string' ? id : ''} />;
}
