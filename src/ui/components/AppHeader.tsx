import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type AppColors,
  sizes,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

interface AppHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: {
    accessibilityLabel: string;
    accessibilityHint?: string;
    icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    onPress: () => void;
  };
}

export function AppHeader({
  title,
  description,
  eyebrow,
  backLabel = 'Voltar',
  onBack,
  rightAction,
}: AppHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);

  return (
    <View>
      {onBack || rightAction ? (
        <View style={styles.topActions}>
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
              <MaterialCommunityIcons
                accessibilityElementsHidden
                accessible={false}
                color={colors.primary}
                importantForAccessibility="no-hide-descendants"
                name="arrow-left"
                size={22}
              />
              <Text style={styles.backText}>{backLabel}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {rightAction ? (
            <Pressable
              accessibilityHint={rightAction.accessibilityHint}
              accessibilityLabel={rightAction.accessibilityLabel}
              accessibilityRole="button"
              hitSlop={8}
              onPress={rightAction.onPress}
              style={({ pressed }) => [
                styles.rightAction,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                accessibilityElementsHidden
                accessible={false}
                color={colors.primary}
                importantForAccessibility="no-hide-descendants"
                name={rightAction.icon}
                size={24}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    minHeight: sizes.touchTarget,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
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
}
