import { useEffect, useMemo } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from './BrandMark';
import { motion, motionEasing } from '../motion';
import {
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

export function LaunchLoadingScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    function stop() {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 1;
    }

    function start() {
      if (reduceMotion) {
        stop();
        return;
      }
      const halfCycle = motion.duration.loadingCycle / 2;
      scale.value = withRepeat(
        withSequence(
          withTiming(motion.scale.loadingMax, {
            duration: halfCycle,
            easing: motionEasing.standard,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(motion.scale.loadingMin, {
            duration: halfCycle,
            easing: motionEasing.standard,
            reduceMotion: ReduceMotion.System,
          }),
        ),
        -1,
        true,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(motion.opacity.loadingMin, {
            duration: halfCycle,
            easing: motionEasing.standard,
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(1, {
            duration: halfCycle,
            easing: motionEasing.standard,
            reduceMotion: ReduceMotion.System,
          }),
        ),
        -1,
        true,
      );
    }

    start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });
    return () => {
      subscription.remove();
      stop();
    };
  }, [opacity, reduceMotion, scale]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View style={animatedStyle}>
          <BrandMark size={120} />
        </Animated.View>
        <Text accessibilityRole="header" style={styles.title}>
          Saldo do Dia
        </Text>
        <Text style={styles.description}>Carregando seu planejamento</Text>
        <ActivityIndicator
          accessibilityLabel="Carregando seu planejamento"
          color={colors.primary}
          size="small"
          style={styles.indicator}
        />
      </View>
    </SafeAreaView>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.section,
  },
  description: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.bodySmall,
  },
  indicator: { marginTop: spacing.lg },
  });
}
