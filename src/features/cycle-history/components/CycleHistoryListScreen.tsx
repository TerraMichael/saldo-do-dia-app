import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../../onboarding';
import { AppButton, AppCard, AppHeader, AppScreen, AppStateView, type AppColors, InfoRow, spacing, typography, useAppTheme } from '../../../ui';
import { criarApresentacaoListaCiclos } from '../presenter';

export function CycleHistoryListScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const { ciclosEncerrados } = useOnboarding();
  const ciclos = criarApresentacaoListaCiclos(ciclosEncerrados);
  if (!ciclos.length) {
    return (
      <AppStateView
        description="Quando você iniciar um novo recebimento, o ciclo atual aparecerá aqui."
        primaryAction={{ label: 'Voltar', onPress: () => router.dismissTo('/historico') }}
        title="Nenhum ciclo encerrado"
      />
    );
  }
  return (
    <AppScreen scroll>
      <AppHeader eyebrow="HISTÓRICO" title="Ciclos anteriores" description="Consulte como foi seu planejamento em cada recebimento." onBack={() => router.dismissTo('/historico')} />
      <View style={styles.list}>
        {ciclos.map((ciclo) => (
          <AppCard key={ciclo.id}>
            <Text style={styles.period}>{ciclo.periodo}</Text>
            <InfoRow label="Total gasto" value={ciclo.totalGasto} />
            <InfoRow label="Quantidade de gastos" value={String(ciclo.quantidadeGastos)} />
            <InfoRow label="Saldo ao encerrar" value={ciclo.saldoFinal} last />
            <AppButton
              accessibilityLabel={`Ver detalhes do ciclo ${ciclo.periodo}`}
              label="Ver detalhes"
              onPress={() => router.push({ pathname: '/ciclos/[id]', params: { id: ciclo.id } })}
              variant="secondary"
            />
          </AppCard>
        ))}
      </View>
    </AppScreen>
  );
}
function criarEstilos(colors: AppColors) {
 return StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.xl },
  period: { color: colors.text, marginBottom: spacing.xs, ...typography.section },
 });
}
