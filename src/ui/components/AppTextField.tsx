import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radii, sizes, spacing, typography } from '../theme';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  accessibilityLabel?: string;
}

export function AppTextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  editable = true,
  maxLength,
  autoCapitalize = 'sentences',
  returnKeyType = 'done',
  accessibilityLabel,
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityHint={hint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !editable }}
        autoCapitalize={autoCapitalize}
        autoCorrect
        editable={editable}
        maxLength={maxLength}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType={returnKeyType}
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

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.text, ...typography.label },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    minHeight: sizes.inputHeight,
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  errorInput: { borderColor: colors.error, borderWidth: 2 },
  hint: { color: colors.textMuted, ...typography.bodySmall },
  error: { color: colors.error, ...typography.bodySmall },
  disabled: { opacity: 0.6 },
});
