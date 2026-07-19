import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  colors,
  MoneyInput,
  radii,
  sizes,
  spacing,
  typography,
} from '../../../ui';
import { useOnboarding } from '../context';
import {
  criarConfiguracaoInicial,
  criarDadosFormularioDaConfiguracao,
  criarDataLocalDaDataCivil,
  ErroOnboarding,
  formatarCentavosComoMoedaBrasileira,
  formatarDataCivilParaExibicao,
  formatarDataLocalComoCivil,
  obterDataCivilHoje,
  converterMoedaBrasileiraParaCentavos,
  type CampoOnboarding,
} from '../model';

type ErrosFormulario = Partial<Record<CampoOnboarding, string>>;

function formatarEntradaMonetaria(valor: string): string {
  if (!valor.trim()) return valor;
  try {
    return formatarCentavosComoMoedaBrasileira(
      converterMoedaBrasileiraParaCentavos(valor),
    );
  } catch {
    return valor;
  }
}

function limparEntradaSeZero(valor: string, limpar: () => void) {
  try {
    if (converterMoedaBrasileiraParaCentavos(valor) === 0) limpar();
  } catch {
    // Uma entrada incompleta deve permanecer disponível para correção.
  }
}

function alternarSinal(valor: string): string {
  const texto = valor.trim();
  if (texto.startsWith('R$ -')) return texto.replace('R$ -', 'R$ ');
  if (texto.startsWith('-')) return texto.slice(1);
  if (texto.startsWith('R$ ')) return texto.replace('R$ ', 'R$ -');
  return `-${texto || '0,00'}`;
}

export function OnboardingForm() {
  const router = useRouter();
  const { configuracao, definirConfiguracao } = useOnboarding();
  const dadosAtuais = configuracao
    ? criarDadosFormularioDaConfiguracao(configuracao)
    : undefined;
  const [saldoAtual, setSaldoAtual] = useState(dadosAtuais?.saldoAtual ?? '');
  const [contasPendentes, setContasPendentes] = useState(
    dadosAtuais?.contasPendentes ?? 'R$ 0,00',
  );
  const [reserva, setReserva] = useState(dadosAtuais?.reserva ?? 'R$ 0,00');
  const [dataProximoRecebimento, setDataProximoRecebimento] = useState(
    dadosAtuais?.dataProximoRecebimento ?? '',
  );
  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const [erros, setErros] = useState<ErrosFormulario>({});

  function limparErro(campo: CampoOnboarding) {
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function selecionarData(evento: DateTimePickerEvent, data?: Date) {
    setMostrarSeletor(false);
    if (evento.type === 'set' && data) {
      setDataProximoRecebimento(formatarDataLocalComoCivil(data));
      limparErro('dataProximoRecebimento');
    }
  }

  function continuar() {
    try {
      const novaConfiguracao = criarConfiguracaoInicial({
        saldoAtual,
        contasPendentes,
        reserva,
        dataProximoRecebimento,
      });
      definirConfiguracao({
        ...novaConfiguracao,
        gastosRegistrados: configuracao?.gastosRegistrados ?? [],
      });
      setErros({});
      router.push('/onboarding/revisao');
    } catch (erro) {
      if (erro instanceof ErroOnboarding) {
        setErros((atuais) => ({ ...atuais, [erro.campo]: erro.message }));
        return;
      }
      throw erro;
    }
  }

  const hoje = obterDataCivilHoje();
  const dataSelecionada = dataProximoRecebimento
    ? criarDataLocalDaDataCivil(dataProximoRecebimento)
    : criarDataLocalDaDataCivil(hoje);

  return (
    <AppScreen keyboard scroll>
      <AppHeader
        backLabel="Voltar"
        description="Seus dados ficam salvos somente neste dispositivo."
        eyebrow="ETAPA 1 DE 3"
        onBack={() => router.back()}
        title="Conte sobre seu momento"
      />

      <View style={styles.form}>
        <MoneyInput
          error={erros.saldoAtual}
          hint="Use o botão abaixo se o saldo estiver negativo."
          label="Saldo atual"
          onBlur={() => setSaldoAtual(formatarEntradaMonetaria(saldoAtual))}
          onChangeText={(valor) => {
            setSaldoAtual(valor);
            limparErro('saldoAtual');
          }}
          value={saldoAtual}
        />
        <AppButton
          accessibilityHint="Alterna o sinal do saldo atual entre positivo e negativo."
          label="Alternar saldo positivo ou negativo"
          onPress={() => {
            setSaldoAtual((valor) => alternarSinal(valor));
            limparErro('saldoAtual');
          }}
          variant="tertiary"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Próximo recebimento</Text>
          <Pressable
            accessibilityHint="Abre o seletor de data."
            accessibilityLabel="Selecionar data do próximo recebimento"
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
              minimumDate={criarDataLocalDaDataCivil(hoje)}
              mode="date"
              onChange={selecionarData}
              value={dataSelecionada}
            />
          ) : null}
        </View>

        <MoneyInput
          error={erros.contasPendentes}
          label="Total de contas pendentes"
          onBlur={() => setContasPendentes(formatarEntradaMonetaria(contasPendentes))}
          onChangeText={(valor) => {
            setContasPendentes(valor);
            limparErro('contasPendentes');
          }}
          onFocus={() =>
            limparEntradaSeZero(contasPendentes, () => setContasPendentes(''))
          }
          value={contasPendentes}
        />
        <MoneyInput
          error={erros.reserva}
          hint="Opcional"
          label="Valor que deseja reservar"
          onBlur={() => setReserva(formatarEntradaMonetaria(reserva))}
          onChangeText={(valor) => {
            setReserva(valor);
            limparErro('reserva');
          }}
          onFocus={() => limparEntradaSeZero(reserva, () => setReserva(''))}
          value={reserva}
        />
      </View>

      <View style={styles.action}>
        <AppButton label="Revisar dados" onPress={continuar} />
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
  action: { marginTop: spacing.xxl },
  pressed: { opacity: 0.78 },
});
