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
import { ErroEdicaoGasto } from '../edit-expense';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
} from '../register-expense';
import {
  ErroDescricaoGasto,
  LIMITE_DESCRICAO_GASTO,
} from '../description';

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
  const [descricao, setDescricao] = useState(() => gasto?.descricao ?? '');
  const [erroValor, setErroValor] = useState<string | null>(null);
  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
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
    setErroValor(null);
    setErroDescricao(null);
    try {
      await editarGasto(id, { valor, descricao });
      router.replace('/historico');
    } catch (falha) {
      if (falha instanceof ErroDescricaoGasto) {
        setErroDescricao(falha.message);
      } else if (falha instanceof ErroRegistroGasto || falha instanceof ErroEdicaoGasto) {
        setErroValor(falha.message);
      } else {
        setErroValor(
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
        <View style={styles.fields}>
          <MoneyInput
            editable={!enviando}
            error={erroValor ?? undefined}
            label="Valor do gasto"
            onBlur={formatarEntrada}
            onChangeText={(texto) => {
              entradaAlterada.current = true;
              setValor(texto);
              setErroValor(null);
            }}
            onFocus={prepararEdicao}
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
          icon="content-save-outline"
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
  fields: { gap: spacing.lg, marginTop: spacing.xxl },
  actions: { gap: spacing.xs, marginTop: spacing.xxl },
});
