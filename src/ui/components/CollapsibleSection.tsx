import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type PropsWithChildren, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type AppColors,
  radii,
  sizes,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

interface CollapsibleSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  initiallyExpanded?: boolean;
}

export function CollapsibleSection({
  title,
  description,
  initiallyExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const accessibleTitle = title.toLocaleLowerCase('pt-BR');

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={
          expanded
            ? 'Oculta o conteúdo desta seção.'
            : 'Exibe o conteúdo desta seção.'
        }
        accessibilityLabel={`${
          expanded ? 'Recolher' : 'Expandir'
        } ${accessibleTitle}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          accessibilityElementsHidden
          accessible={false}
          color={colors.primary}
          importantForAccessibility="no-hide-descendants"
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
        />
      </Pressable>

      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    padding: spacing.md,
  },
  headerPressed: { backgroundColor: colors.surfaceMuted },
  heading: { flex: 1, minWidth: 0 },
  title: { color: colors.text, ...typography.section },
  description: {
    color: colors.textMuted,
    marginTop: spacing.xxs,
    ...typography.bodySmall,
  },
  content: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    gap: spacing.xl,
    padding: spacing.md,
  },
  });
}
