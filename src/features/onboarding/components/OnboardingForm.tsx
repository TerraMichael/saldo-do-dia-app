import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { useOnboarding } from '../context';

type ErrosFormulario = Partial<Record<CampoOnboarding, string>>;

interface CampoMonetarioProps {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  onBlur: () => void;
  error?: string;
  hint?: string;
}

function CampoMonetario({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
}: CampoMonetarioProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder="R$ 0,00"
        placeholderTextColor="#849088"
        selectTextOnFocus
        style={[styles.input, error && styles.inputError]}
        value={value}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function formatarEntradaMonetaria(valor: string): string {
  if (!valor.trim()) {
    return valor;
  }

  try {
    return formatarCentavosComoMoedaBrasileira(converterMoedaBrasileiraParaCentavos(valor));
  } catch {
    return valor;
  }
}

function alternarSinal(valor: string): string {
  const texto = valor.trim();

  if (texto.startsWith('R$ -')) {
    return texto.replace('R$ -', 'R$ ');
  }
  if (texto.startsWith('-')) {
    return texto.slice(1);
  }
  if (texto.startsWith('R$ ')) {
    return texto.replace('R$ ', 'R$ -');
  }
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
      const configuracao = criarConfiguracaoInicial({
        saldoAtual,
        contasPendentes,
        reserva,
        dataProximoRecebimento,
      });
      definirConfiguracao(configuracao);
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>‹ Voltar</Text>
            </Pressable>
            <Text style={styles.step}>ETAPA 1 DE 3</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Conte sobre seu momento
            </Text>
            <Text style={styles.description}>
              Esses dados ficam somente nesta sessão por enquanto.
            </Text>
          </View>

          <View style={styles.form}>
            <CampoMonetario
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
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSaldoAtual((valor) => alternarSinal(valor));
                limparErro('saldoAtual');
              }}
              style={styles.signButton}
            >
              <Text style={styles.signButtonText}>Alternar saldo positivo ou negativo</Text>
            </Pressable>

            <View style={styles.field}>
              <Text style={styles.label}>Próximo recebimento</Text>
              <Pressable
                accessibilityLabel="Selecionar data do próximo recebimento"
                accessibilityRole="button"
                onPress={() => setMostrarSeletor(true)}
                style={[styles.input, styles.dateButton, erros.dataProximoRecebimento && styles.inputError]}
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

            <CampoMonetario
              error={erros.contasPendentes}
              label="Total de contas pendentes"
              onBlur={() =>
                setContasPendentes(formatarEntradaMonetaria(contasPendentes))
              }
              onChangeText={(valor) => {
                setContasPendentes(valor);
                limparErro('contasPendentes');
              }}
              value={contasPendentes}
            />

            <CampoMonetario
              error={erros.reserva}
              hint="Opcional"
              label="Valor que deseja reservar"
              onBlur={() => setReserva(formatarEntradaMonetaria(reserva))}
              onChangeText={(valor) => {
                setReserva(valor);
                limparErro('reserva');
              }}
              value={reserva}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={continuar}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Revisar dados</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20, marginTop: 8, paddingVertical: 4 },
  backText: { color: '#28734F', fontSize: 16, fontWeight: '700' },
  step: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 30, fontWeight: '800', lineHeight: 38, marginTop: 8 },
  description: { color: '#526159', fontSize: 16, lineHeight: 24, marginTop: 8 },
  form: { gap: 20, marginTop: 28 },
  field: { gap: 7 },
  label: { color: '#263B30', fontSize: 15, fontWeight: '700' },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CAD8CF',
    borderRadius: 14,
    borderWidth: 1,
    color: '#17251E',
    fontSize: 17,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  inputError: { borderColor: '#B53A3A' },
  hint: { color: '#68766E', fontSize: 13, lineHeight: 18 },
  error: { color: '#A52D2D', fontSize: 13, lineHeight: 18 },
  signButton: { alignSelf: 'flex-start', marginTop: -14, paddingVertical: 4 },
  signButtonText: { color: '#28734F', fontSize: 14, fontWeight: '700' },
  dateButton: { justifyContent: 'center' },
  dateText: { color: '#17251E', fontSize: 17 },
  datePlaceholder: { color: '#849088', fontSize: 17 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#28734F',
    borderRadius: 16,
    marginTop: 32,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
