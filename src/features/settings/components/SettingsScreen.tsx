import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  ReduceMotion,
} from 'react-native-reanimated';

import {
  AppHeader,
  AppScreen,
  type AppColors,
  InlineFeedback,
  motion,
  radii,
  sizes,
  spacing,
  typography,
  useAppTheme,
  type PreferenciaAparencia,
} from '../../../ui';

const OPCOES: readonly {
  preference: PreferenciaAparencia;
  title: string;
  description: string;
  icon: 'theme-light-dark' | 'white-balance-sunny' | 'weather-night';
}[] = [
  {
    preference: 'sistema',
    title: 'Usar tema do aparelho',
    description: 'Acompanha a configuração do Android.',
    icon: 'theme-light-dark',
  },
  {
    preference: 'claro',
    title: 'Claro',
    description: 'Mantém o aplicativo sempre no tema claro.',
    icon: 'white-balance-sunny',
  },
  {
    preference: 'escuro',
    title: 'Escuro',
    description: 'Mantém o aplicativo sempre no tema escuro.',
    icon: 'weather-night',
  },
];

export function SettingsScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const [saving, setSaving] = useState<PreferenciaAparencia | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const operationInProgress = useRef(false);

  async function selectAppearance(nextPreference: PreferenciaAparencia) {
    if (
      operationInProgress.current ||
      (nextPreference === preference && !feedback)
    ) {
      return;
    }

    operationInProgress.current = true;
    setSaving(nextPreference);
    setFeedback(null);
    try {
      await setPreference(nextPreference);
    } catch {
      setFeedback(
        'A aparência foi aplicada nesta sessão, mas não pôde ser salva. Tente novamente.',
      );
    } finally {
      operationInProgress.current = false;
      setSaving(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        description="Personalize a aparência do Saldo do Dia."
        eyebrow="PREFERÊNCIAS"
        onBack={() => router.back()}
        title="Configurações"
      />

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Aparência
        </Text>
        <View style={styles.options}>
          {OPCOES.map((option) => {
            const selected = option.preference === preference;
            const processing = saving === option.preference;
            return (
              <Pressable
                accessibilityHint={option.description}
                accessibilityLabel={`${option.title}. ${option.description}`}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: selected,
                  disabled: saving !== null,
                  busy: processing,
                }}
                disabled={saving !== null}
                key={option.preference}
                onPress={() => void selectAppearance(option.preference)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <MaterialCommunityIcons
                  accessibilityElementsHidden
                  accessible={false}
                  color={selected ? colors.primary : colors.textSecondary}
                  importantForAccessibility="no-hide-descendants"
                  name={option.icon}
                  size={26}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
                <View style={styles.selection}>
                  {selected ? (
                    <Animated.View
                      entering={FadeIn.duration(
                        motion.duration.fast,
                      ).reduceMotion(ReduceMotion.System)}
                    >
                      <MaterialCommunityIcons
                        accessibilityElementsHidden
                        accessible={false}
                        color={colors.primary}
                        importantForAccessibility="no-hide-descendants"
                        name="check-circle"
                        size={22}
                      />
                    </Animated.View>
                  ) : (
                    <MaterialCommunityIcons
                      accessibilityElementsHidden
                      accessible={false}
                      color={colors.textMuted}
                      importantForAccessibility="no-hide-descendants"
                      name="circle-outline"
                      size={22}
                    />
                  )}
                  <Text style={styles.selectionText}>
                    {selected ? 'Selecionado' : 'Selecionar'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {feedback ? (
        <View style={styles.feedback}>
          <InlineFeedback message={feedback} variant="warning" />
        </View>
      ) : null}
    </AppScreen>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
    section: { marginTop: spacing.xl },
    sectionTitle: { color: colors.text, ...typography.section },
    options: { gap: spacing.sm, marginTop: spacing.sm },
    option: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      minHeight: sizes.touchTarget,
      padding: spacing.md,
    },
    optionSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    optionPressed: { opacity: 0.76 },
    optionContent: { flex: 1, minWidth: 160 },
    optionTitle: { color: colors.text, ...typography.label },
    optionDescription: {
      color: colors.textSecondary,
      marginTop: spacing.xxs,
      ...typography.bodySmall,
    },
    selection: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xxs,
    },
    selectionText: { color: colors.textMuted, ...typography.bodySmall },
    feedback: { marginTop: spacing.md },
  });
}
