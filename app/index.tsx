import { Redirect } from 'expo-router';

import { useOnboarding } from '../src/features/onboarding';
import { PlanningStateScreen } from '../src/features/onboarding/components/PlanningStateScreen';
import {
  resolverDestinoInicial,
  useTutorial,
} from '../src/features/tutorial';
import { LaunchLoadingScreen } from '../src/ui';

export default function HomeScreen() {
  const { status } = useOnboarding();
  const { ready, state } = useTutorial();

  if (!ready || status === 'carregando') {
    return <LaunchLoadingScreen />;
  }

  const destino = resolverDestinoInicial(
    status,
    state.apresentacaoConcluida,
  );

  if (destino === 'recuperacao') {
    return <PlanningStateScreen />;
  }

  if (destino === 'carregando') {
    return <LaunchLoadingScreen />;
  }

  return <Redirect href={destino} />;
}
