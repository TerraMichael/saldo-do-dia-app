import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, sizes, spacing, typography } from '../theme';

interface AppHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
}

export function AppHeader({
  title,
  description,
  eyebrow,
  backLabel = 'Voltar',
  onBack,
}: AppHeaderProps) {
  return (
    <View>
      {onBack ? (
        <Pressable
          accessibilityHint="Retorna à tela anterior sem confirmar alterações."
          accessibilityLabel={backLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backText}>‹ {backLabel}</Text>
        </Pressable>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: sizes.touchTarget,
  },
  backText: { color: colors.primary, ...typography.button },
  eyebrow: {
    color: colors.primary,
    letterSpacing: 1.1,
    ...typography.eyebrow,
  },
  title: { color: colors.text, marginTop: spacing.xs, ...typography.title },
  description: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    ...typography.body,
  },
  pressed: { opacity: 0.72 },
});
