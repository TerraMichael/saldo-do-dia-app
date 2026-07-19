import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatarCentavosComoMoedaBrasileira } from '../../../shared/money';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppStateView,
  MoneyInput,
  spacing,
} from '../../../ui';
import { useOnboarding } from '../../onboarding';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
} from '../register-expense';

function formatarEntrada(valor: string): string {
  if (!valor.trim()) return valor;
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
      <AppStateView
        description="Configure seu planejamento antes de registrar um gasto."
        primaryAction={{
          label: 'Ir para o onboarding',
          onPress: () => router.replace('/onboarding'),
        }}
        title="Planejamento não encontrado"
      />
    );
  }

  async function confirmar() {
    if (envioEmAndamento.current) return;
    envioEmAndamento.current = true;
    setEnviando(true);
    setErro(null);
    try {
      await registrarGasto(valor);
      router.replace('/home');
    } catch (falha) {
      if (falha instanceof ErroRegistroGasto) {
        setErro(falha.message);
      } else {
        setErro(
          falha instanceof Error
            ? falha.message
            : 'Não foi possível salvar o gasto. Tente novamente.',
        );
      }
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  return (
    <AppScreen keyboard scroll contentStyle={styles.content}>
      <View>
        <AppHeader
          backLabel="Cancelar"
          description="Seu saldo e limite diário serão recalculados imediatamente."
          eyebrow="ATUALIZAR PLANEJAMENTO"
          onBack={() => router.back()}
          title="Registrar gasto"
        />
        <View style={styles.field}>
          <MoneyInput
            editable={!enviando}
            error={erro ?? undefined}
            hint="Informe apenas o valor. Gastos maiores que o saldo são permitidos."
            label="Valor do gasto"
            onBlur={() => setValor(formatarEntrada(valor))}
            onChangeText={(texto) => {
              setValor(texto);
              setErro(null);
            }}
            value={valor}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label={enviando ? 'Registrando…' : 'Registrar gasto'}
          onPress={() => void confirmar()}
          processing={enviando}
        />
        <AppButton
          disabled={enviando}
          label="Cancelar"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between' },
  field: { marginTop: spacing.xxl },
  actions: { gap: spacing.xs, marginTop: spacing.xxl },
});
