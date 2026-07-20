import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatarCentavosComoMoedaBrasileira } from '../../../shared/money';
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
import {
  formatarDataCivilParaExibicao,
  obterDataCivilHoje,
  useOnboarding,
} from '../../onboarding';
import {
  criarResumoCicloEncerrado,
  iniciarNovoCiclo as criarNovoCiclo,
} from '..';

export function NewCycleReview() {
  const router = useRouter();
  const {
    status,
    configuracao,
    rascunhoNovoCiclo,
    iniciarNovoCiclo,
    cancelarNovoCiclo,
  } = useOnboarding();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const salvamentoEmAndamento = useRef(false);

  if (!configuracao || !rascunhoNovoCiclo) {
    return (
      <AppStateView
        description="Informe os dados do novo ciclo antes de revisar."
        primaryAction={{
          label: 'Voltar ao formulário',
          onPress: () => router.replace('/novo-ciclo'),
        }}
        title="Preencha o novo ciclo primeiro"
      />
    );
  }

  const hoje = obterDataCivilHoje();
  let novoCiclo;
  try {
    novoCiclo = criarNovoCiclo(rascunhoNovoCiclo, hoje);
  } catch {
    return (
      <AppStateView
        description="A data ou algum valor precisa ser atualizado antes da confirmação."
        primaryAction={{
          label: 'Voltar e editar',
          onPress: () => router.back(),
        }}
        title="Revise os dados do novo ciclo"
      />
    );
  }

  const resumo = criarResumoCicloEncerrado(configuracao);

  async function confirmar() {
    if (salvamentoEmAndamento.current) return;
    salvamentoEmAndamento.current = true;
    setSalvando(true);
    setErro(null);
    try {
      await iniciarNovoCiclo();
      router.replace('/home');
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível iniciar o novo ciclo. Tente novamente.',
      );
    } finally {
      salvamentoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  function cancelar() {
    cancelarNovoCiclo();
    router.replace(status === 'expirado' ? '/' : '/home');
  }

  return (
    <AppScreen scroll>
      <AppHeader
        backLabel="Voltar e editar"
        description="O saldo informado será a nova fonte de verdade."
        eyebrow="ETAPA 2 DE 2"
        onBack={() => router.back()}
        title="Revise o novo ciclo"
      />

      <AppCard style={styles.card}>
        <InfoRow
          label="Saldo atual"
          value={formatarCentavosComoMoedaBrasileira(novoCiclo.configuracao.saldoAtual)}
        />
        <InfoRow
          label="Contas pendentes"
          value={formatarCentavosComoMoedaBrasileira(
            novoCiclo.configuracao.contasPendentes,
          )}
        />
        <InfoRow
          label="Reserva protegida"
          value={formatarCentavosComoMoedaBrasileira(novoCiclo.configuracao.reserva)}
        />
        <InfoRow
          label="Próximo recebimento"
          last
          value={formatarDataCivilParaExibicao(
            novoCiclo.configuracao.dataProximoRecebimento,
          )}
        />
      </AppCard>

      <View style={styles.warning}>
        <InlineFeedback
          message="O ciclo atual será encerrado e ficará disponível em Ciclos anteriores. O novo ciclo começará sem gastos registrados."
          title="Encerramento do ciclo atual"
          variant="warning"
        />
        <AppCard style={styles.summary} variant="warning">
          <InfoRow
            label="Registros encerrados"
            value={String(resumo.quantidadeGastos)}
          />
          <InfoRow
            label="Total gasto no ciclo"
            last
            value={formatarCentavosComoMoedaBrasileira(resumo.totalGasto)}
          />
        </AppCard>
      </View>

      {erro ? (
        <View style={styles.feedback}>
          <InlineFeedback message={erro} variant="error" />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          label={salvando ? 'Iniciando…' : 'Iniciar novo ciclo'}
          onPress={() => void confirmar()}
          processing={salvando}
        />
        <AppButton
          disabled={salvando}
          label="Voltar e editar"
          onPress={() => router.back()}
          variant="secondary"
        />
        <AppButton
          disabled={salvando}
          label="Cancelar"
          onPress={cancelar}
          variant="tertiary"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
  warning: { gap: spacing.xs, marginTop: spacing.lg },
  summary: { paddingVertical: 0 },
  feedback: { marginTop: spacing.md },
  actions: { gap: spacing.xs, marginTop: spacing.xl },
});
