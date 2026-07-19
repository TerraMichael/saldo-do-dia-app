import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../context';
import { formatarCentavosComoMoedaBrasileira } from '../model';

export function OnboardingCompletion() {
  const router = useRouter();
  const { resultado } = useOnboarding();

  if (!resultado) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text accessibilityRole="header" style={styles.title}>
            Confirme seus dados primeiro
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/onboarding')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Voltar ao onboarding</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.step}>ETAPA 3 DE 3</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Tudo pronto
        </Text>
        <Text style={styles.description}>Seu limite diário calculado é:</Text>
        <Text accessibilityLabel="Limite diário calculado" style={styles.amount}>
          {formatarCentavosComoMoedaBrasileira(resultado.limiteDiario)}
        </Text>
        <Text style={styles.note}>
          Esta conclusão é temporária. Seus dados ainda não são salvos no aparelho.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Voltar à revisão</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  step: {
    color: '#28734F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  title: {
    color: '#17251E',
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    marginTop: 8,
    textAlign: 'center',
  },
  description: { color: '#526159', fontSize: 17, marginTop: 16, textAlign: 'center' },
  amount: {
    color: '#28734F',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  note: { color: '#68766E', fontSize: 14, lineHeight: 21, marginTop: 24, textAlign: 'center' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#28734F',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 32,
    paddingVertical: 16,
  },
  secondaryButtonText: { color: '#28734F', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
