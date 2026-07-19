import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatarCentavosComoMoedaBrasileira } from '../../../shared/money';
import { useOnboarding } from '../../onboarding';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
} from '../register-expense';

function formatarEntrada(valor: string): string {
  if (!valor.trim()) {
    return valor;
  }

  try {
    return formatarCentavosComoMoedaBrasileira(
      converterValorGastoParaCentavos(valor),
    );
  } catch {
    return valor;
  }
}

export function ExpenseForm() {
  const router = useRouter();
  const { configuracao, registrarGasto } = useOnboarding();
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamento = useRef(false);

  if (!configuracao) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text accessibilityRole="header" style={styles.title}>
            Planejamento não encontrado
          </Text>
          <Text style={styles.description}>
            Configure seu planejamento antes de registrar um gasto.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/onboarding')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Ir para o onboarding</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function confirmar() {
    if (envioEmAndamento.current) {
      return;
    }

    envioEmAndamento.current = true;
    setEnviando(true);
    setErro(null);

    try {
      await registrarGasto(valor);
      router.replace('/home');
    } catch (falha) {
      if (falha instanceof ErroRegistroGasto) {
        setErro(falha.message);
        return;
      }
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível salvar o gasto. Tente novamente.',
      );
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.eyebrow}>ATUALIZAR PLANEJAMENTO</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Registrar gasto
            </Text>
            <Text style={styles.description}>
              Seu saldo e limite diário serão recalculados imediatamente.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Valor do gasto</Text>
            <TextInput
              accessibilityLabel="Valor do gasto"
              editable={!enviando}
              keyboardType="decimal-pad"
              onBlur={() => setValor(formatarEntrada(valor))}
              onChangeText={(texto) => {
                setValor(texto);
                setErro(null);
              }}
              placeholder="R$ 0,00"
              placeholderTextColor="#849088"
              style={[styles.input, erro && styles.inputError]}
              value={valor}
            />
            {erro ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {erro}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: enviando }}
              disabled={enviando}
              onPress={() => void confirmar()}
              style={({ pressed }) => [
                styles.primaryButton,
                enviando && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {enviando ? 'Registrando…' : 'Registrar gasto'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={enviando}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 7 },
  description: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 8 },
  field: { gap: 8, marginTop: 36 },
  label: { color: '#263B30', fontSize: 15, fontWeight: '700' },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CAD8CF',
    borderRadius: 14,
    borderWidth: 1,
    color: '#17251E',
    fontSize: 19,
    minHeight: 58,
    paddingHorizontal: 16,
  },
  inputError: { borderColor: '#B53A3A' },
  error: { color: '#A52D2D', fontSize: 13, lineHeight: 19 },
  actions: { marginTop: 32 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 10, paddingVertical: 14 },
  secondaryButtonText: { color: '#28734F', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  pressed: { opacity: 0.78 },
});
