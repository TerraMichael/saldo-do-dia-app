import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppStateView,
  AnimatedValueText,
  type AppColors,
  CollapsibleSection,
  InfoRow,
  InlineFeedback,
  SectionTitle,
  spacing,
  typography,
  useAppTheme,
} from '../../../ui';
import { useOnboarding } from '../../onboarding';
import { PlanningStateScreen } from '../../onboarding/components/PlanningStateScreen';
import { criarApresentacaoHome } from '../presenter';

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const [screenFocused, setScreenFocused] = useState(true);
  const { status, configuracao, resultado } = useOnboarding();

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  if (status === 'carregando' || status === 'expirado' || status === 'erro') {
    return <PlanningStateScreen />;
  }

  if (!configuracao || !resultado) {
    return (
      <AppStateView
        description="Preencha seus dados para descobrir quanto pode gastar hoje."
        primaryAction={{
          label: 'Começar',
          onPress: () => router.replace('/onboarding'),
        }}
        title="Configure seu planejamento"
      />
    );
  }

  const apresentacao = criarApresentacaoHome(configuracao, resultado);
  const estadoCritico = apresentacao.estado !== 'positivo';

  return (
    <AppScreen scroll>
      <AppHeader
        description="Uma visão simples do seu dinheiro até receber novamente."
        eyebrow="SEU PLANEJAMENTO DE HOJE"
        rightAction={{
          accessibilityHint: 'Abre as preferências do aplicativo.',
          accessibilityLabel: 'Abrir configurações',
          icon: 'cog-outline',
          onPress: () => router.push('/configuracoes'),
        }}
        title="Saldo do Dia"
      />

      <AppCard
        style={styles.hero}
        variant={estadoCritico ? 'warning' : 'highlight'}
      >
        <Text style={styles.heroLabel}>Você ainda pode gastar hoje</Text>
        <AnimatedValueText
          active={screenFocused}
          accessibilityLabel={`Valor restante para hoje: ${apresentacao.restanteHoje}`}
          style={styles.heroAmount}
          value={apresentacao.restanteHoje}
        />
        <View
          accessibilityLabel={`Estado do planejamento: ${apresentacao.tituloEstado}`}
          style={[styles.statusBadge, estadoCritico && styles.statusBadgeCritical]}
        >
          <Text style={[styles.statusText, estadoCritico && styles.statusTextCritical]}>
            {apresentacao.tituloEstado}
          </Text>
        </View>
        <Text style={styles.statusMessage}>{apresentacao.mensagemEstado}</Text>
        {apresentacao.deficit ? (
          <View style={styles.feedback}>
            <InlineFeedback
              message={`Déficit: ${apresentacao.deficit}`}
              variant="error"
            />
          </View>
        ) : null}
        {apresentacao.excedenteHoje ? (
          <View style={styles.feedback}>
            <InlineFeedback
              message={`Excedente de hoje: ${apresentacao.excedenteHoje}`}
              variant="warning"
            />
          </View>
        ) : null}
      </AppCard>

      <View style={styles.primaryAction}>
        <AppButton
          accessibilityHint="Abre o formulário para registrar um gasto e recalcular o planejamento."
          icon="cash-minus"
          label="Registrar gasto"
          onPress={() => router.push('/registrar-gasto')}
        />
      </View>

      <View style={styles.historyAction}>
        <AppButton
          accessibilityHint="Abre os gastos registrados no ciclo atual."
          icon="history"
          label="Ver histórico"
          onPress={() => router.push('/historico')}
          variant="secondary"
        />
      </View>

      <View style={styles.details}>
        <CollapsibleSection
          description="Saldo, gastos, contas, reserva e próximos dias"
          title="Detalhes do planejamento"
        >
          <View>
            <SectionTitle>Resumo de hoje</SectionTitle>
            <AppCard>
              <InfoRow label="Gasto hoje" value={apresentacao.gastoHoje} />
              <InfoRow
                label="Limite planejado"
                value={apresentacao.limitePlanejadoHoje}
              />
              {apresentacao.excedenteHoje ? (
                <InfoRow label="Excedente" value={apresentacao.excedenteHoje} />
              ) : null}
              {apresentacao.limiteDiasFuturos ? (
                <InfoRow
                  label="A partir de amanhã"
                  value={`${apresentacao.limiteDiasFuturos} por dia`}
                  last
                />
              ) : (
                <InfoRow
                  label="A partir de amanhã"
                  value="Sem dias futuros neste ciclo"
                  last
                />
              )}
            </AppCard>
          </View>

          <View>
            <SectionTitle>Planejamento</SectionTitle>
            <AppCard>
              <InfoRow label="Saldo atual" value={apresentacao.saldoAtual} />
              <InfoRow
                emphasis
                label="Disponível para gastos"
                value={apresentacao.valorDisponivel}
              />
              <InfoRow
                label="Contas pendentes"
                value={apresentacao.contasPendentes}
              />
              <InfoRow label="Reserva protegida" value={apresentacao.reserva} />
              <InfoRow
                label="Total de gastos registrados"
                value={apresentacao.totalGastosRegistrados}
              />
              <InfoRow
                label="Até o próximo recebimento"
                value={apresentacao.quantidadeDeDiasTexto}
              />
              <InfoRow
                label="Próximo recebimento"
                last
                value={apresentacao.dataProximoRecebimento}
              />
            </AppCard>
          </View>

          <View>
            <SectionTitle>Opções do planejamento</SectionTitle>
            <AppCard style={styles.options} variant="muted">
              <AppButton
                icon="pencil-outline"
                label="Editar planejamento"
                onPress={() => router.push('/onboarding')}
                variant="tertiary"
              />
              <AppButton
                icon="calendar-refresh"
                label="Novo recebimento"
                onPress={() => router.push('/novo-ciclo')}
                variant="tertiary"
              />
            </AppCard>
          </View>
        </CollapsibleSection>
      </View>
    </AppScreen>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.xl },
  heroLabel: { color: colors.textSecondary, ...typography.bodySmall, fontWeight: '700' },
  heroAmount: {
    color: colors.primaryDark,
    flexShrink: 1,
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.moneyHero,
  },
  statusBadge: {
    backgroundColor: colors.positiveBadge,
    borderRadius: 999,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusBadgeCritical: { backgroundColor: colors.warningBadge },
  statusText: { color: colors.success, fontSize: 13, fontWeight: '800' },
  statusTextCritical: { color: colors.warning },
  statusMessage: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    ...typography.bodySmall,
  },
  feedback: { alignSelf: 'stretch', marginTop: spacing.sm },
  primaryAction: { marginTop: spacing.md },
  historyAction: { marginTop: spacing.sm },
  details: { marginTop: spacing.md },
  options: { gap: spacing.xxs },
  });
}
