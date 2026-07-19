import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import {
  OnboardingProvider,
  useOnboarding,
} from '../src/features/onboarding';
import {
  colors,
  LaunchSplashController,
} from '../src/ui';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useOnboarding();
  const hydrationReady = status !== 'carregando';

  return (
    <LaunchSplashController hydrationReady={hydrationReady}>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar backgroundColor={colors.background} style="dark" />
      </View>
    </LaunchSplashController>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
});
