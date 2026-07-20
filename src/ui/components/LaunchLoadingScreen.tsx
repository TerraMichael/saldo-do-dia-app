import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from './BrandMark';
import {
  type AppColors,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

export function LaunchLoadingScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <BrandMark size={120} />
        <Text accessibilityRole="header" style={styles.title}>
          Saldo do Dia
        </Text>
        <Text style={styles.description}>Carregando seu planejamento</Text>
        <ActivityIndicator
          accessibilityLabel="Carregando seu planejamento"
          color={colors.primary}
          size="small"
          style={styles.indicator}
        />
      </View>
    </SafeAreaView>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
    ...typography.section,
  },
  description: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    ...typography.bodySmall,
  },
  indicator: { marginTop: spacing.lg },
  });
}
