import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  TutorialProvider,
  useTutorial,
} from '../src/features/tutorial';
import { HomeTour } from '../src/features/tutorial/components/HomeTour';
import { renderFeature } from './support/test-harness';

function TourWithRealProvider() {
  const { ready, state, completeHomeTour } = useTutorial();
  const [step, setStep] = useState(0);

  if (!ready) return <Text>Hidratando tutorial</Text>;
  if (state.tourHomeConcluido) return <Text>Sessão continua disponível</Text>;

  return (
    <HomeTour
      onBack={() => setStep((current) => Math.max(0, current - 1))}
      onClose={() => {
        void completeHomeTour().catch(() => {
          // O provider já publicou a conclusão na sessão.
        });
      }}
      onNext={() => setStep((current) => Math.min(3, current + 1))}
      onRequestScroll={jest.fn()}
      step={step}
      targetMeasurementRevision={step}
      targetRect={{ x: 20, y: 80, width: 320, height: 60 }}
    />
  );
}

test('falha ao persistir conclusão do tour não bloqueia a sessão', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(
    new Error('Falha de persistência'),
  );
  renderFeature(
    <TutorialProvider>
      <TourWithRealProvider />
    </TutorialProvider>,
  );

  await screen.findByText('Seu limite de hoje', {
    includeHiddenElements: true,
  });
  const measurement = screen
    .UNSAFE_getAllByType(View)
    .find((node) => node.props.pointerEvents === 'none' && node.props.onLayout);
  if (!measurement) throw new Error('Painel de medição do tour ausente.');
  fireEvent(measurement, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 358, height: 280 } },
  });
  fireEvent.press(
    screen.getByRole('button', { name: 'Fechar e concluir tour' }),
  );

  expect(await screen.findByText('Sessão continua disponível')).toBeTruthy();
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1));
});
