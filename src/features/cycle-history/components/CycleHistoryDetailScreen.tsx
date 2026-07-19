import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../../onboarding';
import { AppCard, AppHeader, AppScreen, AppStateView, InfoRow, InlineFeedback, SectionTitle, colors, spacing, typography } from '../../../ui';
import { criarApresentacaoDetalheCiclo } from '../presenter';

export function CycleHistoryDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { ciclosEncerrados } = useOnboarding();
  const ciclo = criarApresentacaoDetalheCiclo(ciclosEncerrados, id);
  if (!ciclo) {
    return <AppStateView title="Ciclo não encontrado" description="Este ciclo não está mais disponível no histórico." primaryAction={{ label: 'Voltar aos ciclos', onPress: () => router.replace('/ciclos' as Href) }} />;
  }
  return (
    <AppScreen scroll>
      <AppHeader eyebrow="HISTÓRICO" title="Detalhes do ciclo" description={ciclo.periodo} onBack={() => router.back()} />
      {!ciclo.inicioDisponivel ? <View style={styles.feedback}><InlineFeedback message="Alguns dados iniciais não estão disponíveis porque este ciclo foi migrado de uma versão anterior." /></View> : null}
      <View style={styles.section}>
        <SectionTitle>Resumo do ciclo</SectionTitle>
        <AppCard>
          <InfoRow label="Data de encerramento" value={ciclo.dataEncerramento} />
          <InfoRow label="Recebimento previsto" value={ciclo.recebimentoPrevisto} />
          {ciclo.saldoInicial ? <InfoRow label="Saldo inicial" value={ciclo.saldoInicial} /> : null}
          <InfoRow label="Saldo ao encerrar" value={ciclo.saldoFinal} />
          {ciclo.reservaInicial ? <InfoRow label="Reserva inicial" value={ciclo.reservaInicial} /> : null}
          <InfoRow label="Reserva ao encerrar" value={ciclo.reservaFinal} />
          {ciclo.contasIniciais ? <InfoRow label="Contas pendentes iniciais" value={ciclo.contasIniciais} /> : null}
          <InfoRow label="Contas pendentes ao encerrar" value={ciclo.contasFinais} />
          <InfoRow label="Total gasto" value={ciclo.totalGasto} />
          <InfoRow label="Quantidade de gastos" value={String(ciclo.quantidadeGastos)} last />
        </AppCard>
      </View>
      <View style={styles.section}>
        <SectionTitle>Gastos do ciclo</SectionTitle>
        {!ciclo.grupos.length ? <InlineFeedback message="Este ciclo foi encerrado sem gastos registrados." /> : ciclo.grupos.map((grupo) => (
          <AppCard key={grupo.data} style={styles.group}>
            <View style={styles.groupHeader}><Text style={styles.date}>{grupo.data}</Text><Text style={styles.total}>{grupo.total}</Text></View>
            {grupo.gastos.map((gasto) => (
              <InfoRow
                key={gasto.id}
                label={gasto.descricao}
                value={gasto.valor}
              />
            ))}
          </AppCard>
        ))}
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  feedback: { marginTop: spacing.lg },
  section: { marginTop: spacing.xl },
  group: { marginBottom: spacing.sm },
  groupHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  date: { color: colors.text, ...typography.section },
  total: { color: colors.primaryDark, ...typography.label },
});
