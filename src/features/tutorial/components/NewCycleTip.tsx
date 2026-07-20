import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, InlineFeedback, spacing } from '../../../ui';
import { useTutorial } from '../context';
import { DICA_NOVO_RECEBIMENTO } from '../model';

export function NewCycleTip() {
  const { hasSeenContextualTip, markContextualTipSeen } = useTutorial();
  const [visible, setVisible] = useState(
    !hasSeenContextualTip(DICA_NOVO_RECEBIMENTO),
  );

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    void markContextualTipSeen(DICA_NOVO_RECEBIMENTO).catch(() => {
      // A dica permanece encerrada nesta sessão se a gravação falhar.
    });
  }

  return (
    <View style={styles.container}>
      <InlineFeedback
        message="Ao confirmar um novo recebimento, o ciclo atual será encerrado e ficará disponível em Ciclos anteriores. Seus gastos não serão apagados."
        title="Seu ciclo atual ficará salvo"
        variant="info"
      />
      <AppButton label="Entendi" onPress={dismiss} variant="tertiary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, marginTop: spacing.lg },
});
