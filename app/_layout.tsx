import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  OnboardingProvider,
  useOnboarding,
} from '../src/features/onboarding';
import {
  AppThemeProvider,
  type AppColors,
  LaunchSplashController,
  useAppTheme,
} from '../src/ui';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useOnboarding();
  const { colors, statusBarStyle, themeReady } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const planningReady = status !== 'carregando';
  const hydrationReady = planningReady && themeReady;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {
      // A raiz React ainda preserva o fundo correto se a API nativa falhar.
    });
  }, [colors.background]);

  return (
    <LaunchSplashController hydrationReady={hydrationReady}>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar
          backgroundColor={colors.background}
          style={statusBarStyle}
        />
      </View>
    </LaunchSplashController>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <OnboardingProvider>
        <RootNavigator />
      </OnboardingProvider>
    </AppThemeProvider>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    root: { backgroundColor: colors.background, flex: 1 },
  });
}
