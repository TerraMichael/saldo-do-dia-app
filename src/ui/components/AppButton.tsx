import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

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
  const indisponivel = disabled || processing;
  const indicadorClaro = variant === 'primary' || variant === 'destructive';

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: processing, disabled: indisponivel }}
      disabled={indisponivel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        indisponivel && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {processing ? (
        <ActivityIndicator
          color={indicadorClaro ? colors.white : colors.primary}
          size="small"
        />
      ) : null}
      {!processing && icon ? (
        <MaterialCommunityIcons
          accessibilityElementsHidden
          accessible={false}
          color={indicadorClaro ? colors.white : colors.primary}
          importantForAccessibility="no-hide-descendants"
          name={icon}
          size={20}
        />
      ) : null}
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
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
  pressed: { opacity: 0.76 },
  });
}
