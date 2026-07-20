import { useLocalSearchParams } from 'expo-router';

import { IntroductionScreen } from '../src/features/tutorial/components/IntroductionScreen';

export default function IntroductionRoute() {
  const { modo } = useLocalSearchParams<{ modo?: string | string[] }>();
  return <IntroductionScreen reviewMode={modo === 'revisao'} />;
}

