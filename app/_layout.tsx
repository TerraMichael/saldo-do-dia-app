import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';

import {
  OnboardingProvider,
  useOnboarding,
} from '../src/features/onboarding';
import {
  TutorialProvider,
  useTutorial,
} from '../src/features/tutorial';
import {
  AppThemeProvider,
  AppFeedbackHost,
  AppFeedbackProvider,
  type AppColors,
  LaunchSplashController,
  useAppTheme,
} from '../src/ui';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useOnboarding();
  const { ready: tutorialReady } = useTutorial();
  const { colors, statusBarStyle, themeReady } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const planningReady = status !== 'carregando';
  const hydrationReady = planningReady && themeReady && tutorialReady;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {
      // A raiz React ainda preserva o fundo correto se a API nativa falhar.
    });
  }, [colors.background]);

  return (
    <LaunchSplashController hydrationReady={hydrationReady}>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <AppFeedbackHost />
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
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <AppFeedbackProvider>
        <TutorialProvider>
          <OnboardingProvider>
            <RootNavigator />
          </OnboardingProvider>
        </TutorialProvider>
      </AppFeedbackProvider>
    </AppThemeProvider>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    root: { backgroundColor: colors.background, flex: 1 },
  });
}
