import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion } from '../motion';
import {
  type AppColors,
  radii,
  spacing,
  typography,
  useAppTheme,
} from '../theme';
import { useAppFeedback } from './AppFeedbackProvider';

const ENTERING = FadeInDown.duration(motion.duration.standard)
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: -motion.distance.small }],
  })
  .reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(motion.duration.fast).reduceMotion(
  ReduceMotion.System,
);

export function AppFeedbackHost() {
  const { feedback } = useAppFeedback();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  if (!feedback) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + spacing.sm }]}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        entering={ENTERING}
        exiting={EXITING}
        pointerEvents="none"
        style={[styles.feedback, styles[feedback.variant]]}
      >
        <MaterialCommunityIcons
          accessibilityElementsHidden
          accessible={false}
          color={
            feedback.variant === 'success' ? colors.success : colors.primary
          }
          importantForAccessibility="no-hide-descendants"
          name={
            feedback.variant === 'success'
              ? 'check-circle-outline'
              : 'information-outline'
          }
          size={20}
        />
        <Text style={styles.message}>{feedback.message}</Text>
      </Animated.View>
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    host: {
      alignItems: 'center',
      left: spacing.md,
      pointerEvents: 'box-none',
      position: 'absolute',
      right: spacing.md,
      top: 0,
      zIndex: 100,
    },
    feedback: {
      alignItems: 'center',
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.xs,
      maxWidth: 560,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      width: '100%',
    },
    success: {
      backgroundColor: colors.successSoft,
      borderColor: colors.primaryBorder,
    },
    info: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
    },
    message: { color: colors.text, flex: 1, ...typography.bodySmall },
  });
}
