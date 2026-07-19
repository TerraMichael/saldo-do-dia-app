import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  processing?: boolean;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  processing = false,
  accessibilityHint,
}: AppButtonProps) {
  const indisponivel = disabled || processing;
  const indicadorClaro = variant === 'primary' || variant === 'destructive';

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
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
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
