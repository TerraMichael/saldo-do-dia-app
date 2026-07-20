import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

export function SectionTitle({ children }: { children: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  return <Text style={styles.title}>{children}</Text>;
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      marginBottom: spacing.sm,
      ...typography.section,
    },
  });
}
