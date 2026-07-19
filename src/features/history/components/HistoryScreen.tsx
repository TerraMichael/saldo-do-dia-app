import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppStateView,
  colors,
  InfoRow,
  InlineFeedback,
  spacing,
  typography,
} from '../../../ui';
import { useOnboarding } from '../../onboarding';
import { PlanningStateScreen } from '../../onboarding/components/PlanningStateScreen';
import { criarApresentacaoHistorico } from '../presenter';

export function HistoryScreen() {
  const router = useRouter();
  const { status, configuracao, excluirGasto } = useOnboarding();
  const [idProcessando, setIdProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const exclusaoEmAndamento = useRef(false);

  if (status === 'carregando' || status === 'expirado' || status === 'erro') {
    return <PlanningStateScreen />;
  }

  if (!configuracao) {
    return (
      <AppStateView
        description="Crie um planejamento antes de consultar o histórico."
        primaryAction={{
          label: 'Começar',
          onPress: () => router.replace('/onboarding'),
        }}
        title="Configure seu planejamento"
      />
    );
  }

  const apresentacao = criarApresentacaoHistorico(
    configuracao.gastosRegistrados,
    configuracao.dataAtual,
  );

  function solicitarExclusao(id: string) {
    if (exclusaoEmAndamento.current) return;
    Alert.alert(
      'Excluir gasto?',
      'O saldo e o planejamento serão recalculados após a exclusão.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            if (exclusaoEmAndamento.current) return;
            exclusaoEmAndamento.current = true;
            setIdProcessando(id);
            setErro(null);
            void excluirGasto(id)
              .catch((falha: unknown) => {
                setErro(
                  falha instanceof Error
                    ? falha.message
                    : 'Não foi possível excluir o gasto. Tente novamente.',
                );
              })
              .finally(() => {
                exclusaoEmAndamento.current = false;
                setIdProcessando(null);
              });
          },
        },
      ],
    );
  }

  return (
    <AppScreen scroll>
      <AppHeader
        description="Confira os gastos registrados até o próximo recebimento."
        eyebrow="CICLO ATUAL"
        onBack={() => router.back()}
        title="Histórico de gastos"
      />

      <AppCard style={styles.summary} variant="highlight">
        <InfoRow label="Total no ciclo" value={apresentacao.totalCiclo} />
        <InfoRow label="Gasto hoje" value={apresentacao.totalHoje} />
        <InfoRow
          label="Quantidade"
          last
          value={apresentacao.quantidadeRegistrosTexto}
        />
      </AppCard>

      {erro ? (
        <View style={styles.feedback}>
          <InlineFeedback message={erro} variant="error" />
        </View>
      ) : null}

      {apresentacao.vazio ? (
        <AppCard style={styles.emptyCard}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            Nenhum gasto registrado
          </Text>
          <Text style={styles.emptyText}>
            Seus gastos aparecerão aqui depois do primeiro registro.
          </Text>
          <View style={styles.emptyAction}>
            <AppButton
              label="Registrar gasto"
              onPress={() => router.push('/registrar-gasto')}
            />
          </View>
        </AppCard>
      ) : (
        <View style={styles.groups}>
          {apresentacao.grupos.map((grupo) => (
            <AppCard key={grupo.chave} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeading}>
                  <Text style={styles.groupDate}>{grupo.data}</Text>
                  <Text style={styles.groupCount}>
                    {grupo.quantidade} {grupo.quantidade === 1 ? 'gasto' : 'gastos'}
                  </Text>
                </View>
                <Text
                  accessibilityLabel={`Total em ${grupo.data}: ${grupo.total}`}
                  style={styles.groupTotal}
                >
                  {grupo.total}
                </Text>
              </View>

              {grupo.itens.map((item) => (
                <View key={item.chave} style={styles.expenseRow}>
                  <View style={styles.expenseMain}>
                    <Text style={styles.expenseLabel}>Gasto registrado</Text>
                    <Text style={styles.expenseValue}>{item.valor}</Text>
                  </View>
                  <View style={styles.expenseActions}>
                    <View style={styles.itemAction}>
                      <AppButton
                        disabled={idProcessando !== null}
                        label="Editar"
                        onPress={() =>
                          router.push({
                            pathname: '/editar-gasto',
                            params: { id: item.id },
                          })
                        }
                        variant="secondary"
                      />
                    </View>
                    <View style={styles.itemAction}>
                      <AppButton
                        accessibilityHint={`Exclui o gasto de ${item.valor} após confirmação.`}
                        disabled={idProcessando !== null}
                        label={idProcessando === item.id ? 'Excluindo…' : 'Excluir'}
                        onPress={() => solicitarExclusao(item.id)}
                        processing={idProcessando === item.id}
                        variant="destructive"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </AppCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: spacing.xl },
  feedback: { marginTop: spacing.md },
  emptyCard: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { color: colors.text, textAlign: 'center', ...typography.section },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.bodySmall,
  },
  emptyAction: { alignSelf: 'stretch', marginTop: spacing.lg },
  groups: { gap: spacing.md, marginTop: spacing.xl },
  groupCard: { overflow: 'hidden', padding: 0 },
  groupHeader: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  groupHeading: { flexGrow: 1, flexShrink: 1, minWidth: 130 },
  groupDate: { color: colors.text, fontSize: 17, fontWeight: '800' },
  groupCount: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xxs },
  groupTotal: {
    color: colors.primaryDark,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  expenseRow: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  expenseMain: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  expenseLabel: { color: colors.textMuted, flexShrink: 1, ...typography.bodySmall },
  expenseValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  expenseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  itemAction: { minWidth: 108 },
});
