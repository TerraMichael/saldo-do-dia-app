import { type PropsWithChildren, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppColors, sizes, spacing, useAppTheme } from '../theme';
import { useMarkInitialScreenReady } from './LaunchSplashController';

interface AppScreenProps extends PropsWithChildren {
  centered?: boolean;
  keyboard?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppScreen({
  centered = false,
  keyboard = false,
  scroll = false,
  contentStyle,
  children,
}: AppScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const markInitialScreenReady = useMarkInitialScreenReady();
  const handleLayout = (_event: LayoutChangeEvent) => {
    markInitialScreenReady?.();
  };

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        centered && styles.centered,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.content,
        styles.staticContent,
        centered && styles.centered,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView onLayout={handleLayout} style={styles.safeArea}>
      {keyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  scroll: { backgroundColor: colors.background },
  content: {
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: sizes.contentMaxWidth,
  },
  staticContent: { flex: 1 },
  centered: { justifyContent: 'center' },
  });
}
