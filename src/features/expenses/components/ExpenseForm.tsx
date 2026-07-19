import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatarCentavosComoMoedaBrasileira } from '../../../shared/money';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppStateView,
  AppTextField,
  MoneyInput,
  spacing,
} from '../../../ui';
import { useOnboarding } from '../../onboarding';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
} from '../register-expense';
import {
  ErroDescricaoGasto,
  LIMITE_DESCRICAO_GASTO,
} from '../description';

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
  const [descricao, setDescricao] = useState('');
  const [erroValor, setErroValor] = useState<string | null>(null);
  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
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
    setErroValor(null);
    setErroDescricao(null);
    try {
      await registrarGasto({ valor, descricao });
      router.replace('/home');
    } catch (falha) {
      if (falha instanceof ErroDescricaoGasto) {
        setErroDescricao(falha.message);
      } else if (falha instanceof ErroRegistroGasto) {
        setErroValor(falha.message);
      } else {
        setErroValor(
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
        <View style={styles.fields}>
          <MoneyInput
            editable={!enviando}
            error={erroValor ?? undefined}
            hint="Informe apenas o valor. Gastos maiores que o saldo são permitidos."
            label="Valor do gasto"
            onBlur={() => setValor(formatarEntrada(valor))}
            onChangeText={(texto) => {
              setValor(texto);
              setErroValor(null);
            }}
            value={valor}
          />
          <AppTextField
            editable={!enviando}
            error={erroDescricao ?? undefined}
            hint="Ajuda você a identificar o gasto no histórico."
            label="Descrição (opcional)"
            maxLength={LIMITE_DESCRICAO_GASTO}
            onChangeText={(texto) => {
              setDescricao(texto);
              setErroDescricao(null);
            }}
            placeholder="Ex.: mercado, almoço ou combustível"
            value={descricao}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          icon="cash-minus"
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
  fields: { gap: spacing.lg, marginTop: spacing.xxl },
  actions: { gap: spacing.xs, marginTop: spacing.xxl },
});
