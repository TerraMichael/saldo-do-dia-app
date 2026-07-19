import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppStateView,
  InfoRow,
  InlineFeedback,
  spacing,
} from '../../../ui';
import { useOnboarding } from '../context';
import {
  formatarCentavosComoMoedaBrasileira,
  formatarDataCivilParaExibicao,
} from '../model';

export function OnboardingReview() {
  const router = useRouter();
  const { configuracao, confirmarConfiguracao } = useOnboarding();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const salvamentoEmAndamento = useRef(false);

  if (!configuracao) {
    return (
      <AppStateView
        description="Informe os dados do planejamento antes de continuar."
        primaryAction={{
          label: 'Ir para o início',
          onPress: () => router.replace('/onboarding'),
        }}
        title="Preencha seus dados primeiro"
      />
    );
  }

  async function confirmar() {
    if (salvamentoEmAndamento.current) return;
    salvamentoEmAndamento.current = true;
    setSalvando(true);
    setErro(null);
    try {
      await confirmarConfiguracao();
      router.replace('/home');
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível salvar o planejamento. Tente novamente.',
      );
    } finally {
      salvamentoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        backLabel="Voltar e editar"
        description="Confira antes de calcular seu Saldo do Dia."
        eyebrow="ETAPA 2 DE 3"
        onBack={() => router.back()}
        title="Revise seus dados"
      />

      <AppCard style={styles.card}>
        <InfoRow
          label="Saldo atual"
          value={formatarCentavosComoMoedaBrasileira(configuracao.saldoAtual)}
        />
        <InfoRow
          label="Próximo recebimento"
          value={formatarDataCivilParaExibicao(configuracao.dataProximoRecebimento)}
        />
        <InfoRow
          label="Contas pendentes"
          value={formatarCentavosComoMoedaBrasileira(configuracao.contasPendentes)}
        />
        <InfoRow
          label="Reserva"
          last
          value={formatarCentavosComoMoedaBrasileira(configuracao.reserva)}
        />
      </AppCard>

      {erro ? (
        <View style={styles.feedback}>
          <InlineFeedback message={erro} variant="error" />
        </View>
      ) : null}

      <View style={styles.action}>
        <AppButton
          label={salvando ? 'Salvando…' : 'Confirmar'}
          onPress={() => void confirmar()}
          processing={salvando}
        />
      </View>
      <View style={styles.secondaryAction}>
        <AppButton
          disabled={salvando}
          label="Voltar e editar"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
  feedback: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  secondaryAction: { marginTop: spacing.xs },
});
