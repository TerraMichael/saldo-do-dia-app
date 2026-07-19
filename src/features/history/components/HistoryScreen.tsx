import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../../onboarding';
import { PlanningStateScreen } from '../../onboarding/components/PlanningStateScreen';
import { criarApresentacaoHistorico } from '../presenter';

interface ResumoProps {
  label: string;
  valor: string;
}

function Resumo({ label, valor }: ResumoProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{valor}</Text>
    </View>
  );
}

export function HistoryScreen() {
  const router = useRouter();
  const { status, configuracao } = useOnboarding();

  if (status === 'carregando' || status === 'expirado' || status === 'erro') {
    return <PlanningStateScreen />;
  }

  if (!configuracao) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={styles.title}>
            Configure seu planejamento
          </Text>
          <Text style={styles.description}>
            Crie um planejamento antes de consultar o histórico.
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

  const apresentacao = criarApresentacaoHistorico(
    configuracao.gastosRegistrados,
    configuracao.dataAtual,
  );

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

        <Text style={styles.eyebrow}>CICLO ATUAL</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Histórico de gastos
        </Text>
        <Text style={styles.description}>
          Confira os gastos registrados até o próximo recebimento.
        </Text>

        <View style={styles.summaryCard}>
          <Resumo label="Total no ciclo" valor={apresentacao.totalCiclo} />
          <Resumo label="Gasto hoje" valor={apresentacao.totalHoje} />
          <Resumo
            label="Quantidade"
            valor={apresentacao.quantidadeRegistrosTexto}
          />
        </View>

        {apresentacao.vazio ? (
          <View style={styles.emptyCard}>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              Nenhum gasto registrado
            </Text>
            <Text style={styles.emptyText}>
              Seus gastos aparecerão aqui depois do primeiro registro.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/registrar-gasto')}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Registrar gasto</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.groups}>
            {apresentacao.grupos.map((grupo) => (
              <View key={grupo.chave} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View>
                    <Text style={styles.groupDate}>{grupo.data}</Text>
                    <Text style={styles.groupCount}>
                      {grupo.quantidade}{' '}
                      {grupo.quantidade === 1 ? 'gasto' : 'gastos'}
                    </Text>
                  </View>
                  <Text
                    accessibilityLabel={`Total em ${grupo.data}: ${grupo.total}`}
                    style={styles.groupTotal}
                  >
                    {grupo.total}
                  </Text>
                </View>

                {grupo.itens.map((item) => (
                  <View key={item.chave} style={styles.expenseRow}>
                    <Text style={styles.expenseLabel}>Gasto registrado</Text>
                    <Text style={styles.expenseValue}>{item.valor}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { paddingBottom: 36, paddingHorizontal: 20, paddingTop: 8 },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  backButton: { alignSelf: 'flex-start', marginBottom: 18, paddingVertical: 4 },
  backText: { color: '#28734F', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 6 },
  description: { color: '#526159', fontSize: 15, lineHeight: 22, marginTop: 7 },
  summaryCard: {
    backgroundColor: '#E3F2E8',
    borderColor: '#C4DECE',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: 'center',
    borderBottomColor: '#CFE3D6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  summaryLabel: { color: '#526159', fontSize: 14, fontWeight: '600' },
  summaryValue: { color: '#1E6847', fontSize: 16, fontWeight: '800' },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E4DC',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    padding: 22,
  },
  emptyTitle: { color: '#17251E', fontSize: 21, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#68766E', fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  groups: { gap: 16, marginTop: 24 },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E4DC',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: '#F0F6F2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupDate: { color: '#17251E', fontSize: 17, fontWeight: '800' },
  groupCount: { color: '#68766E', fontSize: 12, marginTop: 3 },
  groupTotal: { color: '#1E6847', fontSize: 17, fontWeight: '800' },
  expenseRow: {
    alignItems: 'center',
    borderTopColor: '#E8EEE9',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  expenseLabel: { color: '#68766E', fontSize: 14 },
  expenseValue: { color: '#17251E', fontSize: 16, fontWeight: '700' },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 22,
    paddingVertical: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
