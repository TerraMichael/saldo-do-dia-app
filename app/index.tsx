import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '../src/features/onboarding';
import { PlanningStateScreen } from '../src/features/onboarding/components/PlanningStateScreen';
import {
  AppButton,
  AppScreen,
  type AppColors,
  BrandMark,
  spacing,
  typography,
  useAppTheme,
} from '../src/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const { status } = useOnboarding();

  if (status === 'carregando' || status === 'expirado' || status === 'erro') {
    return <PlanningStateScreen />;
  }

  if (status === 'pronto') {
    return <Redirect href="/home" />;
  }

  return (
    <AppScreen contentStyle={styles.container}>
      <View style={styles.container}>
        <View style={styles.content}>
          <BrandMark size={112} style={styles.brand} />
          <Text style={styles.eyebrow}>SEU DINHEIRO, SEM COMPLICAÇÃO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Saldo do Dia
          </Text>
          <Text style={styles.description}>Descubra quanto você pode gastar hoje</Text>
        </View>

        <AppButton
          accessibilityHint="Inicia a configuração do seu planejamento financeiro."
          label="Começar"
          onPress={() => router.push('/onboarding')}
        />
      </View>
    </AppScreen>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xl },
  content: { flex: 1, justifyContent: 'center' },
  brand: { alignSelf: 'flex-start', marginBottom: spacing.xl },
  eyebrow: { color: colors.primary, letterSpacing: 1.2, marginBottom: spacing.md, ...typography.eyebrow },
  title: { color: colors.text, fontSize: 44, fontWeight: '800', letterSpacing: -1.5, lineHeight: 52 },
  description: { color: colors.textSecondary, fontSize: 20, lineHeight: 30, marginTop: spacing.sm, maxWidth: 320 },
  });
}
