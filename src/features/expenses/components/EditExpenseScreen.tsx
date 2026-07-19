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
import { ErroEdicaoGasto } from '../edit-expense';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
} from '../register-expense';

interface EditExpenseScreenProps {
  id: string;
}

export function EditExpenseScreen({ id }: EditExpenseScreenProps) {
  const router = useRouter();
  const { configuracao, editarGasto } = useOnboarding();
  const gasto = configuracao?.gastosRegistrados.find((item) => item.id === id);
  const valorOriginal = gasto
    ? formatarCentavosComoMoedaBrasileira(gasto.valor)
    : '';
  const [valor, setValor] = useState(() => valorOriginal);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamento = useRef(false);
  const entradaAlterada = useRef(false);

  if (!gasto) {
    return (
      <AppStateView
        description="Este gasto não está mais disponível no planejamento."
        primaryAction={{
          label: 'Voltar ao histórico',
          onPress: () => router.replace('/historico'),
        }}
        title="Gasto não encontrado"
      />
    );
  }

  async function salvar() {
    if (envioEmAndamento.current) return;
    envioEmAndamento.current = true;
    setEnviando(true);
    setErro(null);
    try {
      await editarGasto(id, valor);
      router.replace('/historico');
    } catch (falha) {
      if (falha instanceof ErroRegistroGasto || falha instanceof ErroEdicaoGasto) {
        setErro(falha.message);
      } else {
        setErro(
          falha instanceof Error
            ? falha.message
            : 'Não foi possível salvar a alteração. Tente novamente.',
        );
      }
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  function prepararEdicao() {
    if (!entradaAlterada.current && valor === valorOriginal) setValor('');
  }

  function formatarEntrada() {
    if (!valor.trim()) {
      if (!entradaAlterada.current) setValor(valorOriginal);
      return;
    }
    try {
      setValor(
        formatarCentavosComoMoedaBrasileira(
          converterValorGastoParaCentavos(valor),
        ),
      );
    } catch {
      // A entrada inválida permanece visível para correção no envio.
    }
  }

  return (
    <AppScreen keyboard scroll contentStyle={styles.content}>
      <View>
        <AppHeader
          backLabel="Cancelar"
          description="O saldo e o planejamento serão recalculados."
          eyebrow="CORRIGIR REGISTRO"
          onBack={() => router.back()}
          title="Editar gasto"
        />
        <View style={styles.field}>
          <MoneyInput
            editable={!enviando}
            error={erro ?? undefined}
            label="Valor do gasto"
            onBlur={formatarEntrada}
            onChangeText={(texto) => {
              entradaAlterada.current = true;
              setValor(texto);
              setErro(null);
            }}
            onFocus={prepararEdicao}
            value={valor}
          />
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label={enviando ? 'Salvando…' : 'Salvar alteração'}
          onPress={() => void salvar()}
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
