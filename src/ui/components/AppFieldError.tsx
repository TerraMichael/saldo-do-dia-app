import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { type AppColors, typography, useAppTheme } from '../theme';

interface AppFieldErrorProps {
  label: string;
  message: string;
}

export function AppFieldError({ label, message }: AppFieldErrorProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  return (
    <Text
      accessibilityLabel={`Erro em ${label}: ${message}`}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={styles.error}
    >
      {message}
    </Text>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    error: { color: colors.error, ...typography.bodySmall },
  });
}
