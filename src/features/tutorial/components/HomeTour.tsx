import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  findNodeHandle,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  type AppColors,
  motion,
  radii,
  spacing,
  typography,
  useAppTheme,
} from '../../../ui';
import { PASSOS_TOUR_HOME } from '../model';
import {
  calculateTourPanelPlacement,
  expandRect,
  rectanglesIntersect,
  TOUR_TARGET_GAP,
  type PanelSize,
  type Rect,
} from '../tour-positioning';

interface HomeTourProps {
  step: number;
  targetRect: Rect | null;
  targetMeasurementRevision: number;
  onBack(): void;
  onNext(): void;
  onClose(): void;
  onRequestScroll(delta: number): void;
}

interface MeasuredPanel extends PanelSize {
  step: number;
}

export function HomeTour({
  step,
  targetRect,
  targetMeasurementRevision,
  onBack,
  onNext,
  onClose,
  onRequestScroll,
}: HomeTourProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const headingRef = useRef<Text>(null);
  const focusedStep = useRef<number | null>(null);
  const requestedMeasurement = useRef<string | null>(null);
  const [panel, setPanel] = useState<MeasuredPanel | null>(null);
  const [scrollAttempts, setScrollAttempts] = useState(0);
  const current = PASSOS_TOUR_HOME[step];
  const last = step === PASSOS_TOUR_HOME.length - 1;
  const panelForStep = panel?.step === step ? panel : null;
  const maximumPanelHeight = Math.max(
    0,
    window.height - insets.top - insets.bottom - spacing.xl * 2,
  );
  const availableWidth = Math.max(0, window.width - spacing.md * 2);

  const placement = useMemo(
    () =>
      targetRect && panelForStep
        ? calculateTourPanelPlacement(
            targetRect,
            {
              width: Math.min(panelForStep.width, availableWidth),
              height: Math.min(panelForStep.height, maximumPanelHeight),
            },
            {
              width: window.width,
              height: window.height,
              safeAreaTop: insets.top,
              safeAreaBottom: insets.bottom,
              horizontalMargin: spacing.md,
            },
          )
        : null,
    [
      availableWidth,
      insets.bottom,
      insets.top,
      maximumPanelHeight,
      panelForStep,
      targetRect,
      window.height,
      window.width,
    ],
  );

  const collisionFree =
    placement &&
    targetRect &&
    placement.height > 0 &&
    !rectanglesIntersect(
      placement,
      expandRect(targetRect, TOUR_TARGET_GAP),
    );
  const requiresReposition = Boolean(
    placement && (placement.needsScroll || !collisionFree),
  );
  const positionReady =
    collisionFree && (!requiresReposition || scrollAttempts >= 2);

  useEffect(() => {
    setScrollAttempts(0);
    requestedMeasurement.current = null;
    focusedStep.current = null;
  }, [
    step,
    window.fontScale,
    window.height,
    window.width,
    insets.bottom,
    insets.top,
  ]);

  useEffect(() => {
    if (
      !placement ||
      !requiresReposition ||
      scrollAttempts >= 2 ||
      Math.abs(placement.scrollDelta) < 1
    ) {
      return;
    }
    const requestKey = `${step}:${targetMeasurementRevision}`;
    if (requestedMeasurement.current === requestKey) return;
    requestedMeasurement.current = requestKey;
    setScrollAttempts((currentAttempts) => currentAttempts + 1);
    onRequestScroll(placement.scrollDelta);
  }, [
    onRequestScroll,
    placement,
    requiresReposition,
    scrollAttempts,
    step,
    targetMeasurementRevision,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onClose]);

  function measurePanel(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setPanel((currentPanel) =>
      currentPanel?.step === step &&
      currentPanel.width === width &&
      currentPanel.height === height
        ? currentPanel
        : { step, width, height },
    );
  }

  function focusCurrentStep() {
    if (!positionReady || focusedStep.current === step) return;
    const handle = findNodeHandle(headingRef.current);
    if (handle) {
      focusedStep.current = step;
      AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }

  function renderPanelContent(measuring: boolean) {
    return (
      <>
      <Text style={styles.progress}>
        {step + 1} de {PASSOS_TOUR_HOME.length}
      </Text>
      <Text
        accessibilityLabel={`${current.title}. Passo ${step + 1} de ${PASSOS_TOUR_HOME.length}. ${current.description}`}
        accessibilityRole="header"
        onLayout={measuring ? undefined : focusCurrentStep}
        ref={measuring ? undefined : headingRef}
        style={styles.title}
      >
        {current.title}
      </Text>
      <Text style={styles.description}>{current.description}</Text>
      <View style={styles.actions}>
        <AppButton
          label={last ? 'Entendi' : 'Próximo'}
          onPress={last ? onClose : onNext}
        />
        {step > 0 ? (
          <AppButton label="Anterior" onPress={onBack} variant="secondary" />
        ) : null}
        <AppButton
          accessibilityLabel="Fechar e concluir tour"
          label="Pular tour"
          onPress={onClose}
          variant="tertiary"
        />
      </View>
      </>
    );
  }

  return (
    <View accessibilityViewIsModal style={styles.overlay}>
      <View style={styles.backdrop} />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        key={`panel-measurement-${step}-${window.fontScale}`}
        onLayout={measurePanel}
        pointerEvents="none"
        style={[
          styles.measurementPanel,
          { top: insets.top, width: availableWidth },
        ]}
      >
        <View style={styles.panelContent}>{renderPanelContent(true)}</View>
      </View>

      {positionReady ? (
        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(motion.duration.standard).reduceMotion(
                  ReduceMotion.System,
                )
          }
          exiting={
            reduceMotion
              ? undefined
              : FadeOut.duration(motion.duration.fast).reduceMotion(
                  ReduceMotion.System,
                )
          }
          key={`${step}:${placement.side}`}
          style={[
            styles.panel,
            {
              height: placement.height,
              left: placement.x,
              top: placement.y,
              width: placement.width,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.panelContent}
            showsVerticalScrollIndicator
          >
            {renderPanelContent(false)}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 200,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      opacity: 0.76,
    },
    measurementPanel: {
      left: spacing.md,
      opacity: 0,
      position: 'absolute',
    },
    panel: {
      backgroundColor: colors.surface,
      borderColor: colors.primaryBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'absolute',
    },
    panelContent: { padding: spacing.lg },
    progress: { color: colors.primary, ...typography.label },
    title: {
      color: colors.text,
      marginTop: spacing.xs,
      ...typography.section,
    },
    description: {
      color: colors.textSecondary,
      marginTop: spacing.sm,
      ...typography.body,
    },
    actions: { gap: spacing.xs, marginTop: spacing.lg },
  });
}
