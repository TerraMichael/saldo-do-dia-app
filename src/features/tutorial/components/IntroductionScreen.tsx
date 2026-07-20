import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOut,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  type AppColors,
  BrandMark,
  motion,
  spacing,
  typography,
  useAppTheme,
} from '../../../ui';
import { PASSOS_APRESENTACAO } from '../model';
import { useTutorial } from '../context';

interface IntroductionScreenProps {
  reviewMode?: boolean;
}

export function IntroductionScreen({
  reviewMode = false,
}: IntroductionScreenProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const { completeIntroduction } = useTutorial();
  const [step, setStep] = useState(0);
  const current = PASSOS_APRESENTACAO[step];
  const last = step === PASSOS_APRESENTACAO.length - 1;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${current.title}. ${step + 1} de ${PASSOS_APRESENTACAO.length}.`,
    );
  }, [current.title, step]);

  useEffect(() => {
    if (!reviewMode) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        router.dismissTo('/configuracoes');
        return true;
      },
    );
    return () => subscription.remove();
  }, [reviewMode, router]);

  async function finishFirstAccess() {
    try {
      await completeIntroduction();
    } catch {
      // A preferência permanece concluída nesta sessão e não bloqueia o fluxo.
    }
    router.replace('/onboarding');
  }

  function finishReview() {
    router.dismissTo('/configuracoes');
  }

  function finish() {
    if (reviewMode) {
      finishReview();
      return;
    }
    void finishFirstAccess();
  }

  return (
    <AppScreen scroll contentStyle={styles.screen}>
      <AppHeader
        onBack={reviewMode ? finishReview : undefined}
        title="Apresentação"
      />
      <Animated.View
        entering={
          reduceMotion
            ? undefined
            : FadeInRight.duration(motion.duration.standard)
                .withInitialValues({
                  opacity: 0,
                  transform: [{ translateX: motion.distance.small }],
                })
                .reduceMotion(ReduceMotion.System)
        }
        exiting={
          reduceMotion
            ? undefined
            : FadeOut.duration(motion.duration.fast).reduceMotion(
                ReduceMotion.System,
              )
        }
        key={step}
        style={styles.content}
      >
        <BrandMark size={88} style={styles.brand} />
        <Text style={styles.eyebrow}>{current.eyebrow}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {current.title}
        </Text>
        <Text style={styles.description}>{current.description}</Text>
        {current.complement ? (
          <AppCard style={styles.complement} variant="muted">
            <Text style={styles.complementText}>{current.complement}</Text>
          </AppCard>
        ) : null}
        <Text
          accessibilityLabel={`Passo ${step + 1} de ${PASSOS_APRESENTACAO.length}`}
          style={styles.progress}
        >
          {step + 1} de {PASSOS_APRESENTACAO.length}
        </Text>
      </Animated.View>

      <View style={styles.actions}>
        <AppButton
          label={
            last
              ? reviewMode
                ? 'Voltar às configurações'
                : 'Começar meu planejamento'
              : 'Continuar'
          }
          onPress={() => (last ? finish() : setStep((value) => value + 1))}
        />
        {step > 0 ? (
          <AppButton
            label="Anterior"
            onPress={() => setStep((value) => Math.max(0, value - 1))}
            variant="secondary"
          />
        ) : null}
        {!reviewMode ? (
          <AppButton
            label="Pular apresentação"
            onPress={() => void finishFirstAccess()}
            variant="tertiary"
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    screen: { flexGrow: 1 },
    content: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xl },
    brand: { alignSelf: 'flex-start', marginBottom: spacing.xl },
    eyebrow: {
      color: colors.primary,
      letterSpacing: 1.1,
      ...typography.eyebrow,
    },
    title: { color: colors.text, marginTop: spacing.sm, ...typography.title },
    description: {
      color: colors.textSecondary,
      marginTop: spacing.md,
      ...typography.body,
    },
    complement: { marginTop: spacing.lg },
    complementText: { color: colors.textSecondary, ...typography.bodySmall },
    progress: {
      color: colors.textMuted,
      marginTop: spacing.xl,
      ...typography.label,
    },
    actions: { gap: spacing.xs, marginTop: spacing.xl },
  });
}

