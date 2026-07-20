import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, motionEasing } from '../motion';
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
  const reduceMotion = useReducedMotion();
  const chevronRotation = useSharedValue(initiallyExpanded ? 180 : 0);
  const accessibleTitle = title.toLocaleLowerCase('pt-BR');
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 180 : 0, {
      duration: reduceMotion
        ? motion.duration.immediate
        : motion.duration.standard,
      easing: motionEasing.standard,
      reduceMotion: ReduceMotion.System,
    });
  }, [chevronRotation, expanded, reduceMotion]);

  return (
    <Animated.View
      layout={LinearTransition.duration(motion.duration.standard).reduceMotion(
        ReduceMotion.System,
      )}
      style={styles.container}
    >
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
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons
            accessibilityElementsHidden
            accessible={false}
            color={colors.primary}
            importantForAccessibility="no-hide-descendants"
            name="chevron-down"
            size={24}
          />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(motion.duration.standard)
            .withInitialValues({
              opacity: 0,
              transform: [{ translateY: -motion.distance.small }],
            })
            .reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(motion.duration.fast).reduceMotion(
            ReduceMotion.System,
          )}
          layout={LinearTransition.duration(
            motion.duration.standard,
          ).reduceMotion(ReduceMotion.System)}
          style={styles.content}
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
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
