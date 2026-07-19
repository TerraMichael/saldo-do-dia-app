import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../../onboarding';
import { criarApresentacaoHome } from '../presenter';

interface LinhaPlanejamentoProps {
  label: string;
  value: string;
}

function LinhaPlanejamento({ label, value }: LinhaPlanejamentoProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { configuracao, resultado } = useOnboarding();

  if (!configuracao || !resultado) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            Configure seu planejamento
          </Text>
          <Text style={styles.emptyText}>
            Preencha seus dados para descobrir quanto pode gastar hoje.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/onboarding')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Começar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const apresentacao = criarApresentacaoHome(configuracao, resultado);
  const estadoCritico = apresentacao.estado !== 'positivo';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>SEU PLANEJAMENTO DE HOJE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Saldo do Dia
        </Text>
        <Text style={styles.support}>Uma visão simples do seu dinheiro até receber novamente.</Text>

        <View style={[styles.hero, estadoCritico && styles.heroCritical]}>
          <Text style={styles.heroLabel}>Você ainda pode gastar hoje</Text>
          <Text accessibilityLabel="Valor restante para hoje" style={styles.heroAmount}>
            {apresentacao.restanteHoje}
          </Text>
          <View style={[styles.statusBadge, estadoCritico && styles.statusBadgeCritical]}>
            <Text style={[styles.statusText, estadoCritico && styles.statusTextCritical]}>
              {apresentacao.tituloEstado}
            </Text>
          </View>
          <Text style={styles.statusMessage}>{apresentacao.mensagemEstado}</Text>
          {apresentacao.deficit ? (
            <Text accessibilityRole="alert" style={styles.deficit}>
              Déficit: {apresentacao.deficit}
            </Text>
          ) : null}
          {apresentacao.excedenteHoje ? (
            <Text accessibilityRole="alert" style={styles.deficit}>
              Excedente de hoje: {apresentacao.excedenteHoje}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Seu planejamento</Text>
        <View style={styles.card}>
          <LinhaPlanejamento label="Saldo atual" value={apresentacao.saldoAtual} />
          <LinhaPlanejamento
            label="Disponível para gastos"
            value={apresentacao.valorDisponivel}
          />
          <LinhaPlanejamento
            label="Contas pendentes"
            value={apresentacao.contasPendentes}
          />
          <LinhaPlanejamento label="Reserva protegida" value={apresentacao.reserva} />
          <LinhaPlanejamento
            label="Gasto hoje"
            value={apresentacao.gastoHoje}
          />
          <LinhaPlanejamento
            label="Limite planejado de hoje"
            value={apresentacao.limitePlanejadoHoje}
          />
          {apresentacao.limiteDiasFuturos ? (
            <LinhaPlanejamento
              label="A partir de amanhã"
              value={`${apresentacao.limiteDiasFuturos} por dia`}
            />
          ) : null}
          <LinhaPlanejamento
            label="Total de gastos registrados"
            value={apresentacao.totalGastosRegistrados}
          />
          <LinhaPlanejamento
            label="Até o próximo recebimento"
            value={apresentacao.quantidadeDeDiasTexto}
          />
          <LinhaPlanejamento
            label="Próximo recebimento"
            value={apresentacao.dataProximoRecebimento}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/registrar-gasto')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Registrar gasto</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Editar planejamento</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { paddingBottom: 36, paddingHorizontal: 20, paddingTop: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyTitle: { color: '#17251E', fontSize: 30, fontWeight: '800', lineHeight: 38 },
  emptyText: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 8 },
  eyebrow: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 34, fontWeight: '800', lineHeight: 42, marginTop: 5 },
  support: { color: '#526159', fontSize: 15, lineHeight: 22, marginTop: 6 },
  hero: {
    alignItems: 'center',
    backgroundColor: '#E3F2E8',
    borderColor: '#C4DECE',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 26,
  },
  heroCritical: { backgroundColor: '#FFF4E8', borderColor: '#EDCFAE' },
  heroLabel: { color: '#526159', fontSize: 15, fontWeight: '700' },
  heroAmount: { color: '#1E6847', fontSize: 42, fontWeight: '800', marginTop: 6 },
  statusBadge: {
    backgroundColor: '#D2E9DA',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeCritical: { backgroundColor: '#F7DFC2' },
  statusText: { color: '#1E6847', fontSize: 13, fontWeight: '800' },
  statusTextCritical: { color: '#8A4E18' },
  statusMessage: {
    color: '#526159',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  deficit: { color: '#A13B2A', fontSize: 15, fontWeight: '800', marginTop: 10 },
  sectionTitle: { color: '#263B30', fontSize: 18, fontWeight: '800', marginTop: 26 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E4DC',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#E8EEE9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingVertical: 12,
  },
  rowLabel: { color: '#68766E', flex: 1, fontSize: 14, lineHeight: 19 },
  rowValue: { color: '#17251E', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 24,
    paddingVertical: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 10, paddingVertical: 14 },
  secondaryButtonText: { color: '#28734F', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
