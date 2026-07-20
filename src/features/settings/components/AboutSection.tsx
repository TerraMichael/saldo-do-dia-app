import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAppReleaseInfo } from '../../../shared/app-release';
import {
  AppCard,
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../../../ui';

export function AboutSection() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const release = useMemo(() => getAppReleaseInfo(), []);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Sobre
      </Text>
      <AppCard style={styles.card} variant="muted">
        <View
          accessibilityLabel={release.accessibilityLabel}
          accessible
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.product}>{release.productName}</Text>
            <Text style={styles.metadata}>Versão {release.version}</Text>
            <Text style={styles.metadata}>Release {release.release}</Text>
            <Text style={styles.signature}>
              Powered by {release.publisherName}
            </Text>
          </View>
        </View>
      </AppCard>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    section: { marginTop: spacing.xl },
    sectionTitle: { color: colors.text, ...typography.section },
    card: { marginTop: spacing.sm },
    product: { color: colors.text, ...typography.section },
    metadata: {
      color: colors.textSecondary,
      marginTop: spacing.xxs,
      ...typography.bodySmall,
    },
    signature: {
      color: colors.textMuted,
      marginTop: spacing.md,
      ...typography.bodySmall,
    },
  });
}
