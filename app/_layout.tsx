import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { OnboardingProvider } from '../src/features/onboarding';
import { colors } from '../src/ui';

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar backgroundColor={colors.background} style="dark" />
    </OnboardingProvider>
  );
}
