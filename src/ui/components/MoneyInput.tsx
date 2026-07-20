import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  type AppColors,
  radii,
  sizes,
  spacing,
  typography,
  useAppTheme,
} from '../theme';

interface MoneyInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
  error?: string;
  hint?: string;
  editable?: boolean;
  placeholder?: string;
}

export function MoneyInput({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  hint,
  editable = true,
  placeholder = 'R$ 0,00',
}: MoneyInputProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => criarEstilos(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        keyboardType="decimal-pad"
        onBlur={() => {
          setFocused(false);
          onBlur();
        }}
        onChangeText={onChangeText}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        style={[
          styles.input,
          focused && styles.focused,
          error && styles.errorInput,
          !editable && styles.disabled,
        ]}
        value={value}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function criarEstilos(colors: AppColors) {
  return StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.text, ...typography.label },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    minHeight: sizes.inputHeight,
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  errorInput: { borderColor: colors.error, borderWidth: 2 },
  hint: { color: colors.textMuted, ...typography.bodySmall },
  error: { color: colors.error, ...typography.bodySmall },
  disabled: { opacity: 0.6 },
  });
}
