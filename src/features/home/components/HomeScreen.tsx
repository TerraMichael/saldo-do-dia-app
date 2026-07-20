import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

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
import {
  PASSOS_TOUR_HOME,
  type Rect,
  useTutorial,
} from '../../tutorial';
import { HomeTour } from '../../tutorial/components/HomeTour';
import { criarApresentacaoHome } from '../presenter';

type AlvoTour = (typeof PASSOS_TOUR_HOME)[number]['target'];

export function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const [screenFocused, setScreenFocused] = useState(true);
  const { status, configuracao, resultado } = useOnboarding();
  const {
    ready: tutorialReady,
    state: tutorialState,
    completeHomeTour,
  } = useTutorial();
  const reduceMotion = useReducedMotion();
  const window = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const limitTargetRef = useRef<View>(null);
  const registerTargetRef = useRef<View>(null);
  const historyTargetRef = useRef<View>(null);
  const detailsTargetRef = useRef<View>(null);
  const scrollOffset = useRef(0);
  const measureFrame = useRef<number | null>(null);
  const scrollWatchFrame = useRef<number | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [targetMeasurementRevision, setTargetMeasurementRevision] =
    useState(0);
  const [scrollingForTour, setScrollingForTour] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  const tourVisible =
    tutorialReady &&
    status === 'pronto' &&
    screenFocused &&
    Boolean(configuracao && resultado) &&
    !tutorialState.tourHomeConcluido;

  const obterRefAlvo = useCallback((target: AlvoTour) => {
    const refs = {
      limite: limitTargetRef,
      registrar: registerTargetRef,
      historico: historyTargetRef,
      detalhes: detailsTargetRef,
    };
    return refs[target];
  }, []);

  const medirAlvoAtual = useCallback(() => {
    const target = PASSOS_TOUR_HOME[tourStep].target;
    obterRefAlvo(target).current?.measureInWindow((x, y, width, height) => {
      setTargetRect({ x, y, width, height });
      setTargetMeasurementRevision((revision) => revision + 1);
    });
  }, [obterRefAlvo, tourStep]);

  const agendarMedicao = useCallback(() => {
    if (measureFrame.current !== null) return;
    measureFrame.current = requestAnimationFrame(() => {
      measureFrame.current = null;
      medirAlvoAtual();
    });
  }, [medirAlvoAtual]);

  const concluirRolagemDoTour = useCallback(() => {
    if (scrollWatchFrame.current !== null) {
      cancelAnimationFrame(scrollWatchFrame.current);
      scrollWatchFrame.current = null;
    }
    setScrollingForTour(false);
    agendarMedicao();
  }, [agendarMedicao]);

  const rolarParaCriarEspaco = useCallback(
    (delta: number) => {
      if (Math.abs(delta) < 1) {
        agendarMedicao();
        return;
      }
      setTargetRect(null);
      setScrollingForTour(true);
      if (scrollWatchFrame.current !== null) {
        cancelAnimationFrame(scrollWatchFrame.current);
      }

      const initialOffset = scrollOffset.current;
      let lastOffset = initialOffset;
      let stableFrames = 0;
      let frames = 0;
      let changed = false;
      const observeScroll = () => {
        const currentOffset = scrollOffset.current;
        changed ||= Math.abs(currentOffset - initialOffset) >= 0.5;
        stableFrames =
          Math.abs(currentOffset - lastOffset) < 0.5 ? stableFrames + 1 : 0;
        lastOffset = currentOffset;
        frames += 1;
        if (
          (changed && stableFrames >= 2) ||
          (!changed && frames >= 6) ||
          frames >= 30
        ) {
          concluirRolagemDoTour();
          return;
        }
        scrollWatchFrame.current = requestAnimationFrame(observeScroll);
      };

      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollOffset.current + delta),
        animated: !reduceMotion,
      });
      scrollWatchFrame.current = requestAnimationFrame(observeScroll);
    },
    [agendarMedicao, concluirRolagemDoTour, reduceMotion],
  );

  useEffect(() => {
    if (!tourVisible) {
      setTourStep(0);
      setTargetRect(null);
      return;
    }
    setTargetRect(null);
    agendarMedicao();
  }, [agendarMedicao, tourStep, tourVisible, window.height, window.width]);

  useEffect(
    () => () => {
      if (measureFrame.current !== null) {
        cancelAnimationFrame(measureFrame.current);
      }
      if (scrollWatchFrame.current !== null) {
        cancelAnimationFrame(scrollWatchFrame.current);
      }
    },
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && tourVisible) {
        setTargetRect(null);
        agendarMedicao();
      }
    });
    return () => subscription.remove();
  }, [agendarMedicao, tourVisible]);

  const concluirTour = useCallback(() => {
    void completeHomeTour().catch(() => {
      // A conclusão permanece aplicada na sessão mesmo se a gravação falhar.
    });
  }, [completeHomeTour]);

  function registrarRolagem(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    if (tourVisible) agendarMedicao();
  }

  function estiloAlvo(target: AlvoTour) {
    return [
      styles.tourTarget,
      tourVisible &&
        PASSOS_TOUR_HOME[tourStep].target === target &&
        styles.tourTargetActive,
    ];
  }

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
    <AppScreen
      contentAccessibilityHidden={tourVisible}
      overlay={
        tourVisible ? (
          <HomeTour
            onBack={() => setTourStep((value) => Math.max(0, value - 1))}
            onClose={concluirTour}
            onNext={() =>
              setTourStep((value) =>
                Math.min(PASSOS_TOUR_HOME.length - 1, value + 1),
              )
            }
            onRequestScroll={rolarParaCriarEspaco}
            step={tourStep}
            targetMeasurementRevision={targetMeasurementRevision}
            targetRect={scrollingForTour ? null : targetRect}
          />
        ) : null
      }
      scroll
      onContentSizeChange={agendarMedicao}
      onMomentumScrollEnd={concluirRolagemDoTour}
      onScroll={registrarRolagem}
      scrollRef={scrollRef}
    >
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

      <View
        onLayout={agendarMedicao}
        ref={limitTargetRef}
        style={estiloAlvo('limite')}
      >
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
      </View>

      <View
        onLayout={agendarMedicao}
        ref={registerTargetRef}
        style={estiloAlvo('registrar')}
      >
        <View style={styles.primaryAction}>
          <AppButton
            accessibilityHint="Abre o formulário para registrar um gasto e recalcular o planejamento."
            icon="cash-minus"
            label="Registrar gasto"
            onPress={() => router.push('/registrar-gasto')}
          />
        </View>
      </View>

      <View
        onLayout={agendarMedicao}
        ref={historyTargetRef}
        style={estiloAlvo('historico')}
      >
        <View style={styles.historyAction}>
          <AppButton
            accessibilityHint="Abre os gastos registrados no ciclo atual."
            icon="history"
            label="Ver histórico"
            onPress={() => router.push('/historico')}
            variant="secondary"
          />
        </View>
      </View>

      <View
        onLayout={agendarMedicao}
        ref={detailsTargetRef}
        style={[styles.details, ...estiloAlvo('detalhes')]}
      >
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
  hero: { alignItems: 'center', padding: spacing.xl },
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
  tourTarget: {
    borderColor: 'transparent',
    borderRadius: 20,
    borderWidth: 2,
    marginTop: spacing.sm,
  },
  tourTargetActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  });
}
