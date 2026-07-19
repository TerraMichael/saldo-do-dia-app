import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../context';

export function PlanningStateScreen() {
  const router = useRouter();
  const {
    status,
    falhaHidratacao,
    tentarHidratar,
    recomecarPlanejamento,
  } = useOnboarding();
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const acaoEmAndamento = useRef(false);

  async function executar(acao: () => Promise<void>) {
    if (acaoEmAndamento.current) {
      return;
    }

    acaoEmAndamento.current = true;
    setProcessando(true);
    setErroAcao(null);
    try {
      await acao();
    } catch (erro) {
      setErroAcao(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível concluir a operação. Tente novamente.',
      );
    } finally {
      acaoEmAndamento.current = false;
      setProcessando(false);
    }
  }

  if (status === 'carregando') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text accessibilityRole="header" style={styles.title}>
            Carregando seu planejamento
          </Text>
          <Text style={styles.description}>Aguarde só um instante.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const expirado = status === 'expirado';
  const dadosCorrompidos =
    status === 'erro' && falhaHidratacao?.origem === 'dados-corrompidos';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          {expirado ? 'Atualize seu planejamento' : 'Não foi possível carregar'}
        </Text>
        <Text style={styles.description}>
          {expirado
            ? 'A data do seu recebimento passou. Atualize seu planejamento.'
            : falhaHidratacao?.mensagem ??
              'Não foi possível carregar os dados do planejamento.'}
        </Text>

        {erroAcao ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {erroAcao}
          </Text>
        ) : null}

        {expirado ? (
          <Pressable
            accessibilityRole="button"
            disabled={processando}
            onPress={() => router.replace('/onboarding')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Editar planejamento</Text>
          </Pressable>
        ) : null}

        {status === 'erro' && !dadosCorrompidos ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: processando }}
            disabled={processando}
            onPress={() => void executar(tentarHidratar)}
            style={({ pressed }) => [
              styles.primaryButton,
              processando && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {processando ? 'Tentando…' : 'Tentar novamente'}
            </Text>
          </Pressable>
        ) : null}

        {dadosCorrompidos ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: processando }}
            disabled={processando}
            onPress={() =>
              void executar(async () => {
                await recomecarPlanejamento();
                router.replace('/');
              })
            }
            style={({ pressed }) => [
              styles.primaryButton,
              processando && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {processando ? 'Removendo…' : 'Recomeçar planejamento'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { color: '#17251E', fontSize: 30, fontWeight: '800', lineHeight: 38 },
  description: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 10 },
  error: { color: '#A52D2D', fontSize: 14, lineHeight: 20, marginTop: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 24,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
});
