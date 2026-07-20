import { type PropsWithChildren, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  type AppColors,
  type AppTheme,
  radii,
  spacing,
  useAppTheme,
} from '../theme';

type CardVariant = 'default' | 'highlight' | 'warning' | 'error' | 'muted';

interface AppCardProps extends PropsWithChildren {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({
  variant = 'default',
  style,
  children,
}: AppCardProps) {
  const { colors, elevation } = useAppTheme();
  const styles = useMemo(
    () => criarEstilos(colors, elevation),
    [colors, elevation],
  );
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
}

function criarEstilos(
  colors: AppColors,
  elevation: AppTheme['elevation'],
) {
  return StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...elevation.card,
  },
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  highlight: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  error: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.errorBorder,
  },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  });
}
