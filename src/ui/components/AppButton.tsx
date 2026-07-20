import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, motionEasing } from '../motion';
import {
  type AppColors,
  radii,
  sizes,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  processing?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  processing = false,
  accessibilityLabel,
  accessibilityHint,
  icon,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const indisponivel = disabled || processing;
  const indicadorClaro = variant === 'primary' || variant === 'destructive';
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  function animatePress(pressed: boolean) {
    if (indisponivel) return;
    const duration = pressed
      ? motion.duration.pressIn
      : motion.duration.pressOut;
    const nextScale = pressed && !reduceMotion ? motion.scale.pressed : 1;
    const nextOpacity = pressed ? motion.opacity.pressed : 1;
    scale.value = withTiming(nextScale, {
      duration: reduceMotion ? motion.duration.immediate : duration,
      easing: motionEasing.standard,
      reduceMotion: ReduceMotion.System,
    });
    opacity.value = withTiming(nextOpacity, {
      duration: reduceMotion ? motion.duration.immediate : duration,
      easing: motionEasing.standard,
      reduceMotion: ReduceMotion.System,
    });
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ busy: processing, disabled: indisponivel }}
        disabled={indisponivel}
        onPress={onPress}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        style={[
          styles.base,
          styles[variant],
          indisponivel && styles.disabled,
        ]}
      >
        {processing || icon ? (
          <View style={styles.leading}>
            {processing ? (
              <Animated.View
                entering={FadeIn.duration(motion.duration.fast).reduceMotion(
                  ReduceMotion.System,
                )}
                exiting={FadeOut.duration(motion.duration.fast).reduceMotion(
                  ReduceMotion.System,
                )}
                style={styles.centered}
              >
                <ActivityIndicator
                  color={indicadorClaro ? colors.white : colors.primary}
                  size="small"
                />
              </Animated.View>
            ) : null}
            {!processing && icon ? (
              <Animated.View
                entering={FadeIn.duration(motion.duration.fast).reduceMotion(
                  ReduceMotion.System,
                )}
                exiting={FadeOut.duration(motion.duration.fast).reduceMotion(
                  ReduceMotion.System,
                )}
                style={styles.centered}
              >
                <MaterialCommunityIcons
                  accessibilityElementsHidden
                  accessible={false}
                  color={indicadorClaro ? colors.white : colors.primary}
                  importantForAccessibility="no-hide-descendants"
                  name={icon}
                  size={20}
                />
              </Animated.View>
            ) : null}
          </View>
        ) : null}
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  tertiary: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.error },
  label: { textAlign: 'center', ...typography.button },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primary },
  tertiaryLabel: { color: colors.textMuted },
  destructiveLabel: { color: colors.white },
  disabled: { opacity: 0.55 },
  leading: { height: 20, width: 20 },
  centered: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    width: 20,
  },
  });
}
