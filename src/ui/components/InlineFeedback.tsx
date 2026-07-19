import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type FeedbackVariant = 'info' | 'success' | 'warning' | 'error';

interface InlineFeedbackProps {
  message: string;
  title?: string;
  variant?: FeedbackVariant;
}

export function InlineFeedback({
  message,
  title,
  variant = 'info',
}: InlineFeedbackProps) {
  const alert = variant === 'error' || variant === 'warning';
  return (
    <View
      accessibilityRole={alert ? 'alert' : undefined}
      style={[styles.base, styles[variant]]}
    >
      {title ? <Text style={[styles.title, styles[`${variant}Text`]]}>{title}</Text> : null}
      <Text style={[styles.message, styles[`${variant}Text`]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xxs,
    padding: spacing.sm,
  },
  info: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  success: { backgroundColor: colors.successSoft, borderColor: colors.primaryBorder },
  warning: { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder },
  error: { backgroundColor: colors.errorSoft, borderColor: colors.errorBorder },
  title: { ...typography.bodySmall, fontWeight: '800' },
  message: { ...typography.bodySmall },
  infoText: { color: colors.textSecondary },
  successText: { color: colors.success },
  warningText: { color: colors.warningText },
  errorText: { color: colors.errorStrong },
});
