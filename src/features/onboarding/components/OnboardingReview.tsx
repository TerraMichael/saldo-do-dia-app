import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../context';
import {
  formatarCentavosComoMoedaBrasileira,
  formatarDataCivilParaExibicao,
} from '../model';

interface LinhaRevisaoProps {
  label: string;
  value: string;
}

function LinhaRevisao({ label, value }: LinhaRevisaoProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function OnboardingReview() {
  const router = useRouter();
  const { configuracao, confirmarConfiguracao } = useOnboarding();

  if (!configuracao) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text accessibilityRole="header" style={styles.title}>
            Preencha seus dados primeiro
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/onboarding')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Ir para o início</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function confirmar() {
    confirmarConfiguracao();
    router.push('/onboarding/conclusao');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.step}>ETAPA 2 DE 3</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Revise seus dados
        </Text>
        <Text style={styles.description}>Confira antes de calcular seu Saldo do Dia.</Text>

        <View style={styles.card}>
          <LinhaRevisao
            label="Saldo atual"
            value={formatarCentavosComoMoedaBrasileira(configuracao.saldoAtual)}
          />
          <LinhaRevisao
            label="Próximo recebimento"
            value={formatarDataCivilParaExibicao(configuracao.dataProximoRecebimento)}
          />
          <LinhaRevisao
            label="Contas pendentes"
            value={formatarCentavosComoMoedaBrasileira(configuracao.contasPendentes)}
          />
          <LinhaRevisao
            label="Reserva"
            value={formatarCentavosComoMoedaBrasileira(configuracao.reserva)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={confirmar}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Confirmar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20, marginTop: 8, paddingVertical: 4 },
  backText: { color: '#28734F', fontSize: 16, fontWeight: '700' },
  step: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 30, fontWeight: '800', lineHeight: 38, marginTop: 8 },
  description: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E4DC',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 18,
  },
  row: { borderBottomColor: '#E8EEE9', borderBottomWidth: 1, gap: 5, paddingVertical: 16 },
  label: { color: '#68766E', fontSize: 13, fontWeight: '600' },
  value: { color: '#17251E', fontSize: 18, fontWeight: '700' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 28,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
