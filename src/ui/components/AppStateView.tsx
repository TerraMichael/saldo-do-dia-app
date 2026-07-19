import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppScreen } from './AppScreen';
import { colors, spacing, typography } from '../theme';

interface StateAction {
  label: string;
  onPress: () => void;
  processing?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
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
  return (
    <AppScreen centered>
      <AppCard style={styles.card}>
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

const styles = StyleSheet.create({
  card: { padding: spacing.xl },
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
