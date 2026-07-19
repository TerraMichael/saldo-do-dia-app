import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, sizes, spacing } from '../theme';

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
  const content = scroll ? (
    <ScrollView
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
    <SafeAreaView style={styles.safeArea}>
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

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
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
