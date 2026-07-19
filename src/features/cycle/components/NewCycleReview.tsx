import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatarCentavosComoMoedaBrasileira } from '../../../shared/money';
import {
  formatarDataCivilParaExibicao,
  obterDataCivilHoje,
  useOnboarding,
} from '../../onboarding';
import {
  criarResumoCicloEncerrado,
  iniciarNovoCiclo as criarNovoCiclo,
} from '..';

interface LinhaProps {
  label: string;
  valor: string;
}

function Linha({ label, valor }: LinhaProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{valor}</Text>
    </View>
  );
}

export function NewCycleReview() {
  const router = useRouter();
  const {
    status,
    configuracao,
    rascunhoNovoCiclo,
    iniciarNovoCiclo,
    cancelarNovoCiclo,
  } = useOnboarding();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const salvamentoEmAndamento = useRef(false);

  if (!configuracao || !rascunhoNovoCiclo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={styles.title}>
            Preencha o novo ciclo primeiro
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/novo-ciclo')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Voltar ao formulário</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hoje = obterDataCivilHoje();
  let novoCiclo;
  try {
    novoCiclo = criarNovoCiclo(rascunhoNovoCiclo, hoje);
  } catch {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={styles.title}>
            Revise os dados do novo ciclo
          </Text>
          <Text style={styles.description}>
            A data ou algum valor precisa ser atualizado antes da confirmação.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Voltar e editar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const resumo = criarResumoCicloEncerrado(configuracao);

  async function confirmar() {
    if (salvamentoEmAndamento.current) {
      return;
    }
    salvamentoEmAndamento.current = true;
    setSalvando(true);
    setErro(null);
    try {
      await iniciarNovoCiclo();
      router.replace('/home');
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível iniciar o novo ciclo. Tente novamente.',
      );
    } finally {
      salvamentoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  function cancelar() {
    cancelarNovoCiclo();
    router.replace(status === 'expirado' ? '/' : '/home');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          disabled={salvando}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Voltar e editar</Text>
        </Pressable>
        <Text style={styles.step}>ETAPA 2 DE 2</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Revise o novo ciclo
        </Text>
        <Text style={styles.description}>
          O saldo informado será a nova fonte de verdade.
        </Text>

        <View style={styles.card}>
          <Linha
            label="Saldo atual"
            valor={formatarCentavosComoMoedaBrasileira(
              novoCiclo.configuracao.saldoAtual,
            )}
          />
          <Linha
            label="Contas pendentes"
            valor={formatarCentavosComoMoedaBrasileira(
              novoCiclo.configuracao.contasPendentes,
            )}
          />
          <Linha
            label="Reserva protegida"
            valor={formatarCentavosComoMoedaBrasileira(
              novoCiclo.configuracao.reserva,
            )}
          />
          <Linha
            label="Próximo recebimento"
            valor={formatarDataCivilParaExibicao(
              novoCiclo.configuracao.dataProximoRecebimento,
            )}
          />
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Encerramento do ciclo atual</Text>
          <Text style={styles.warningText}>
            Os gastos do ciclo atual deixarão de aparecer no histórico.
          </Text>
          <Linha
            label="Registros encerrados"
            valor={String(resumo.quantidadeGastos)}
          />
          <Linha
            label="Total gasto no ciclo"
            valor={formatarCentavosComoMoedaBrasileira(resumo.totalGasto)}
          />
        </View>

        {erro ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {erro}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: salvando }}
          disabled={salvando}
          onPress={() => void confirmar()}
          style={({ pressed }) => [
            styles.primaryButton,
            salvando && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {salvando ? 'Iniciando…' : 'Iniciar novo ciclo'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={salvando}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Voltar e editar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={salvando}
          onPress={cancelar}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 8 },
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 18, paddingVertical: 4 },
  backText: { color: '#28734F', fontSize: 16, fontWeight: '700' },
  step: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 30, fontWeight: '800', lineHeight: 38, marginTop: 7 },
  description: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E4DC',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  warningCard: {
    backgroundColor: '#FFF4E8',
    borderColor: '#EDCFAE',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  warningTitle: { color: '#8A4E18', fontSize: 17, fontWeight: '800' },
  warningText: { color: '#714B28', fontSize: 14, lineHeight: 21, marginBottom: 8, marginTop: 6 },
  row: {
    alignItems: 'center',
    borderBottomColor: '#E8EEE9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 54,
  },
  rowLabel: { color: '#68766E', flex: 1, fontSize: 14 },
  rowValue: { color: '#17251E', fontSize: 15, fontWeight: '800', textAlign: 'right' },
  error: { color: '#A52D2D', fontSize: 14, lineHeight: 20, marginTop: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 24,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 8, paddingVertical: 13 },
  secondaryButtonText: { color: '#28734F', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
});
