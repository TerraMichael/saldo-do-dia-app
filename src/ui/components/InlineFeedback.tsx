import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  type AppColors,
  radii,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

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
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const alert = variant === 'error' || variant === 'warning';
  const icon =
    variant === 'error'
      ? 'alert-circle-outline'
      : variant === 'warning'
        ? 'alert-outline'
        : variant === 'success'
          ? 'check-circle-outline'
          : 'information-outline';
  return (
    <View
      accessibilityRole={alert ? 'alert' : undefined}
      style={[styles.base, styles[variant]]}
    >
      <MaterialCommunityIcons
        accessibilityElementsHidden
        accessible={false}
        color={styles[`${variant}Text`].color}
        importantForAccessibility="no-hide-descendants"
        name={icon}
        size={20}
      />
      <View style={styles.content}>
        {title ? <Text style={[styles.title, styles[`${variant}Text`]]}>{title}</Text> : null}
        <Text style={[styles.message, styles[`${variant}Text`]]}>{message}</Text>
      </View>
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  base: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xxs,
    flexDirection: 'row',
    padding: spacing.sm,
  },
  content: { flex: 1, gap: spacing.xxs },
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
}
