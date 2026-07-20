import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton, type AppButtonProps } from './AppButton';
import { BrandMark } from './BrandMark';
import { AppCard } from './AppCard';
import { AppScreen } from './AppScreen';
import {
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

interface StateAction {
  label: string;
  onPress: () => void;
  processing?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  icon?: AppButtonProps['icon'];
}

interface AppStateViewProps {
  title: string;
  description: string;
  loading?: boolean;
  feedback?: string | null;
  primaryAction?: StateAction;
  secondaryAction?: StateAction;
}

export function AppStateView({
  title,
  description,
  loading = false,
  feedback,
  primaryAction,
  secondaryAction,
}: AppStateViewProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  return (
    <AppScreen centered>
      <AppCard style={styles.card}>
        {!loading ? <BrandMark size={72} style={styles.brand} /> : null}
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Carregando"
            color={colors.primary}
            size="large"
          />
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
        {feedback ? (
          <Text accessibilityRole="alert" style={styles.feedback}>
            {feedback}
          </Text>
        ) : null}
        {primaryAction ? (
          <View style={styles.firstAction}>
            <AppButton {...primaryAction} />
          </View>
        ) : null}
        {secondaryAction ? (
          <View style={styles.action}>
            <AppButton {...secondaryAction} />
          </View>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  card: { padding: spacing.xl },
  brand: { marginBottom: spacing.xs },
  title: { color: colors.text, marginTop: spacing.md, ...typography.title },
  description: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    ...typography.body,
  },
  feedback: {
    color: colors.error,
    marginTop: spacing.md,
    ...typography.bodySmall,
  },
  firstAction: { marginTop: spacing.xl },
  action: { marginTop: spacing.xs },
  });
}
