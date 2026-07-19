import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  converterMoedaBrasileiraParaCentavos,
  formatarCentavosComoMoedaBrasileira,
} from '../../../shared/money';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppStateView,
  colors,
  MoneyInput,
  radii,
  sizes,
  spacing,
  typography,
} from '../../../ui';
import {
  criarDataLocalDaDataCivil,
  formatarDataCivilParaExibicao,
  formatarDataLocalComoCivil,
  obterDataCivilHoje,
  useOnboarding,
} from '../../onboarding';
import { ErroNovoCiclo, iniciarNovoCiclo, type CampoNovoCiclo } from '..';

type ErrosFormulario = Partial<Record<CampoNovoCiclo, string>>;

function formatarEntrada(valor: string): string {
  if (!valor.trim()) return valor;
  try {
    return formatarCentavosComoMoedaBrasileira(
      converterMoedaBrasileiraParaCentavos(valor),
    );
  } catch {
    return valor;
  }
}

function limparSeZero(valor: string, limpar: () => void) {
  try {
    if (converterMoedaBrasileiraParaCentavos(valor) === 0) limpar();
  } catch {
    // A entrada permanece disponível para correção.
  }
}

function alternarSinal(valor: string): string {
  const texto = valor.trim();
  if (texto.startsWith('R$ -')) return texto.replace('R$ -', 'R$ ');
  if (texto.startsWith('-')) return texto.slice(1);
  if (texto.startsWith('R$ ')) return texto.replace('R$ ', 'R$ -');
  return `-${texto || '0,00'}`;
}

function obterAmanha(dataAtual: string): string {
  const amanha = criarDataLocalDaDataCivil(dataAtual);
  amanha.setDate(amanha.getDate() + 1);
  return formatarDataLocalComoCivil(amanha);
}

export function NewCycleForm() {
  const router = useRouter();
  const {
    configuracao,
    rascunhoNovoCiclo,
    prepararNovoCiclo,
    cancelarNovoCiclo,
  } = useOnboarding();
  const [saldoAtual, setSaldoAtual] = useState(rascunhoNovoCiclo?.saldoAtual ?? '');
  const [contasPendentes, setContasPendentes] = useState(
    rascunhoNovoCiclo?.contasPendentes ?? 'R$ 0,00',
  );
  const [reserva, setReserva] = useState(
    rascunhoNovoCiclo?.reserva ?? 'R$ 0,00',
  );
  const [dataProximoRecebimento, setDataProximoRecebimento] = useState(
    rascunhoNovoCiclo?.dataProximoRecebimento ?? '',
  );
  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});

  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelarNovoCiclo();
      router.back();
      return true;
    });
    return () => assinatura.remove();
  }, [cancelarNovoCiclo, router]);

  if (!configuracao) {
    return (
      <AppStateView
        description="Crie seu planejamento antes de iniciar um novo ciclo."
        title="Planejamento não encontrado"
      />
    );
  }

  const hoje = obterDataCivilHoje();
  const amanha = obterAmanha(hoje);

  function limparErro(campo: CampoNovoCiclo) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function selecionarData(evento: DateTimePickerEvent, data?: Date) {
    setMostrarSeletor(false);
    if (evento.type === 'set' && data) {
      setDataProximoRecebimento(formatarDataLocalComoCivil(data));
      limparErro('dataProximoRecebimento');
    }
  }

  function cancelar() {
    cancelarNovoCiclo();
    router.back();
  }

  function revisar() {
    const dados = { saldoAtual, contasPendentes, reserva, dataProximoRecebimento };
    try {
      iniciarNovoCiclo(dados, hoje);
      prepararNovoCiclo(dados);
      setErros({});
      router.push('/novo-ciclo/revisao');
    } catch (erro) {
      if (erro instanceof ErroNovoCiclo) {
        setErros((atuais) => ({ ...atuais, [erro.campo]: erro.message }));
        return;
      }
      throw erro;
    }
  }

  return (
    <AppScreen keyboard scroll>
      <AppHeader
        backLabel="Cancelar"
        description="Informe como ficou seu dinheiro depois de receber."
        eyebrow="ETAPA 1 DE 2"
        onBack={cancelar}
        title="Novo ciclo"
      />

      <View style={styles.form}>
        <MoneyInput
          error={erros.saldoAtual}
          label="Saldo atual depois de receber"
          onBlur={() => setSaldoAtual(formatarEntrada(saldoAtual))}
          onChangeText={(valor) => {
            setSaldoAtual(valor);
            limparErro('saldoAtual');
          }}
          value={saldoAtual}
        />
        <AppButton
          label="Alternar saldo positivo ou negativo"
          onPress={() => {
            setSaldoAtual((valor) => alternarSinal(valor));
            limparErro('saldoAtual');
          }}
          variant="tertiary"
        />
        <MoneyInput
          error={erros.contasPendentes}
          label="Contas pendentes"
          onBlur={() => setContasPendentes(formatarEntrada(contasPendentes))}
          onChangeText={(valor) => {
            setContasPendentes(valor);
            limparErro('contasPendentes');
          }}
          onFocus={() => limparSeZero(contasPendentes, () => setContasPendentes(''))}
          value={contasPendentes}
        />
        <MoneyInput
          error={erros.reserva}
          label="Reserva protegida"
          onBlur={() => setReserva(formatarEntrada(reserva))}
          onChangeText={(valor) => {
            setReserva(valor);
            limparErro('reserva');
          }}
          onFocus={() => limparSeZero(reserva, () => setReserva(''))}
          value={reserva}
        />
        <View style={styles.field}>
          <Text style={styles.label}>Próximo recebimento</Text>
          <Pressable
            accessibilityHint="Abre o seletor de data."
            accessibilityLabel="Selecionar próximo recebimento"
            accessibilityRole="button"
            onPress={() => setMostrarSeletor(true)}
            style={({ pressed }) => [
              styles.dateButton,
              erros.dataProximoRecebimento && styles.inputError,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={
                dataProximoRecebimento ? styles.dateText : styles.datePlaceholder
              }
            >
              {dataProximoRecebimento
                ? formatarDataCivilParaExibicao(dataProximoRecebimento)
                : 'Selecionar data'}
            </Text>
          </Pressable>
          {erros.dataProximoRecebimento ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {erros.dataProximoRecebimento}
            </Text>
          ) : null}
          {mostrarSeletor ? (
            <DateTimePicker
              minimumDate={criarDataLocalDaDataCivil(amanha)}
              mode="date"
              onChange={selecionarData}
              value={criarDataLocalDaDataCivil(dataProximoRecebimento || amanha)}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Revisar novo ciclo" onPress={revisar} />
        <AppButton label="Cancelar" onPress={cancelar} variant="secondary" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginTop: spacing.xl },
  field: { gap: spacing.xs },
  label: { color: colors.text, ...typography.label },
  dateButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: sizes.inputHeight,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.error, borderWidth: 2 },
  dateText: { color: colors.text, fontSize: 17 },
  datePlaceholder: { color: colors.placeholder, fontSize: 17 },
  error: { color: colors.error, ...typography.bodySmall },
  actions: { gap: spacing.xs, marginTop: spacing.xxl },
  pressed: { opacity: 0.78 },
});
