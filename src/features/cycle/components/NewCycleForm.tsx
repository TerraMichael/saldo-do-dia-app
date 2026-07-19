import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
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
  converterMoedaBrasileiraParaCentavos,
  formatarCentavosComoMoedaBrasileira,
} from '../../../shared/money';
import {
  criarDataLocalDaDataCivil,
  formatarDataCivilParaExibicao,
  formatarDataLocalComoCivil,
  obterDataCivilHoje,
  useOnboarding,
} from '../../onboarding';
import {
  ErroNovoCiclo,
  iniciarNovoCiclo,
  type CampoNovoCiclo,
} from '..';

type ErrosFormulario = Partial<Record<CampoNovoCiclo, string>>;

interface CampoMonetarioProps {
  label: string;
  valor: string;
  erro?: string;
  onBlur: () => void;
  onChangeText: (valor: string) => void;
  onFocus?: () => void;
}

function CampoMonetario({
  label,
  valor,
  erro,
  onBlur,
  onChangeText,
  onFocus,
}: CampoMonetarioProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="R$ 0,00"
        placeholderTextColor="#849088"
        style={[styles.input, erro && styles.inputError]}
        value={valor}
      />
      {erro ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

function formatarEntrada(valor: string): string {
  if (!valor.trim()) {
    return valor;
  }
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
    if (converterMoedaBrasileiraParaCentavos(valor) === 0) {
      limpar();
    }
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
  const [saldoAtual, setSaldoAtual] = useState(
    rascunhoNovoCiclo?.saldoAtual ?? '',
  );
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={styles.title}>
            Planejamento não encontrado
          </Text>
          <Text style={styles.description}>
            Crie seu planejamento antes de iniciar um novo ciclo.
          </Text>
        </View>
      </SafeAreaView>
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
    const dados = {
      saldoAtual,
      contasPendentes,
      reserva,
      dataProximoRecebimento,
    };
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.step}>ETAPA 1 DE 2</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Novo ciclo
            </Text>
            <Text style={styles.description}>
              Informe como ficou seu dinheiro depois de receber.
            </Text>
          </View>

          <View style={styles.form}>
            <CampoMonetario
              erro={erros.saldoAtual}
              label="Saldo atual depois de receber"
              onBlur={() => setSaldoAtual(formatarEntrada(saldoAtual))}
              onChangeText={(valor) => {
                setSaldoAtual(valor);
                limparErro('saldoAtual');
              }}
              valor={saldoAtual}
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

            <CampoMonetario
              erro={erros.contasPendentes}
              label="Contas pendentes"
              onBlur={() => setContasPendentes(formatarEntrada(contasPendentes))}
              onChangeText={(valor) => {
                setContasPendentes(valor);
                limparErro('contasPendentes');
              }}
              onFocus={() =>
                limparSeZero(contasPendentes, () => setContasPendentes(''))
              }
              valor={contasPendentes}
            />
            <CampoMonetario
              erro={erros.reserva}
              label="Reserva protegida"
              onBlur={() => setReserva(formatarEntrada(reserva))}
              onChangeText={(valor) => {
                setReserva(valor);
                limparErro('reserva');
              }}
              onFocus={() => limparSeZero(reserva, () => setReserva(''))}
              valor={reserva}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Próximo recebimento</Text>
              <Pressable
                accessibilityLabel="Selecionar próximo recebimento"
                accessibilityRole="button"
                onPress={() => setMostrarSeletor(true)}
                style={[
                  styles.input,
                  styles.dateButton,
                  erros.dataProximoRecebimento && styles.inputError,
                ]}
              >
                <Text
                  style={
                    dataProximoRecebimento
                      ? styles.dateText
                      : styles.datePlaceholder
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
                  value={criarDataLocalDaDataCivil(
                    dataProximoRecebimento || amanha,
                  )}
                />
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={revisar}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Revisar novo ciclo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={cancelar}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
  container: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 18 },
  step: { color: '#28734F', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#17251E', fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 7 },
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
    marginTop: 30,
    paddingVertical: 17,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 10, paddingVertical: 14 },
  secondaryButtonText: { color: '#28734F', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
