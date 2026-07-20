import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean;
  emphasis?: boolean;
}

export function InfoRow({ label, value, last = false, emphasis = false }: InfoRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.emphasis]}>{value}</Text>
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: 1 },
  label: {
    color: colors.textMuted,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
    ...typography.bodySmall,
  },
  value: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    minWidth: 90,
    textAlign: 'right',
  },
  emphasis: { color: colors.primaryDark, fontWeight: '800' },
  });
}
