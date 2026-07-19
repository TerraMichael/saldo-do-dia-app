import {
  calcularQuantidadeDeDiasRestantes,
  type Centavos,
  type EntradaCalculoDiario,
} from '../daily-limit';
import {
  converterMoedaBrasileiraParaCentavos as converterMoedaCompartilhada,
  ErroMoeda,
  formatarCentavosComoMoedaBrasileira as formatarMoedaCompartilhada,
} from '../../shared/money';

export type CampoOnboarding =
  | 'saldoAtual'
  | 'contasPendentes'
  | 'reserva'
  | 'dataProximoRecebimento';

export type CodigoErroOnboarding =
  | 'CAMPO_OBRIGATORIO'
  | 'VALOR_INVALIDO'
  | 'VALOR_NEGATIVO'
  | 'DATA_INVALIDA';

export class ErroOnboarding extends Error {
  constructor(
    public readonly campo: CampoOnboarding,
    public readonly codigo: CodigoErroOnboarding,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroOnboarding';
  }
}

export interface DadosFormularioOnboarding {
  saldoAtual: string;
  contasPendentes?: string;
  reserva?: string;
  dataProximoRecebimento: string;
}

export function criarDadosFormularioDaConfiguracao(
  configuracao: EntradaCalculoDiario,
): DadosFormularioOnboarding {
  return {
    saldoAtual: formatarCentavosComoMoedaBrasileira(configuracao.saldoAtual),
    contasPendentes: formatarCentavosComoMoedaBrasileira(configuracao.contasPendentes),
    reserva: formatarCentavosComoMoedaBrasileira(configuracao.reserva),
    dataProximoRecebimento: configuracao.dataProximoRecebimento,
  };
}

const FORMATO_DATA_CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

export function converterMoedaBrasileiraParaCentavos(valor: string): Centavos {
  try {
    return converterMoedaCompartilhada(valor);
  } catch (erro) {
    if (erro instanceof ErroMoeda) {
      throw new ErroOnboarding('saldoAtual', 'VALOR_INVALIDO', erro.message);
    }
    throw erro;
  }
}

export function formatarCentavosComoMoedaBrasileira(valor: Centavos): string {
  try {
    return formatarMoedaCompartilhada(valor);
  } catch (erro) {
    if (erro instanceof ErroMoeda) {
      throw new ErroOnboarding('saldoAtual', 'VALOR_INVALIDO', erro.message);
    }
    throw erro;
  }
}

export function formatarDataCivilParaExibicao(data: string): string {
  const correspondencia = FORMATO_DATA_CIVIL.exec(data);

  if (!correspondencia) {
    throw new ErroOnboarding(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'Selecione uma data válida.',
    );
  }

  const [, ano, mes, dia] = correspondencia;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataLocalComoCivil(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function criarDataLocalDaDataCivil(data: string): Date {
  const correspondencia = FORMATO_DATA_CIVIL.exec(data);

  if (!correspondencia) {
    throw new ErroOnboarding(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'Selecione uma data válida.',
    );
  }

  const [, anoTexto, mesTexto, diaTexto] = correspondencia;
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const resultado = new Date(ano, mes - 1, dia, 12);

  if (
    resultado.getFullYear() !== ano ||
    resultado.getMonth() !== mes - 1 ||
    resultado.getDate() !== dia
  ) {
    throw new ErroOnboarding(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'Selecione uma data válida.',
    );
  }

  return resultado;
}

export function obterDataCivilHoje(agora = new Date()): string {
  return formatarDataLocalComoCivil(agora);
}

function converterCampoMonetario(
  valor: string | undefined,
  campo: CampoOnboarding,
  rotulo: string,
  permiteNegativo: boolean,
  valorPadrao?: string,
): Centavos {
  const preenchido = valor?.trim() || valorPadrao;

  if (!preenchido) {
    throw new ErroOnboarding(campo, 'CAMPO_OBRIGATORIO', `${rotulo} é obrigatório.`);
  }

  let centavos: Centavos;

  try {
    centavos = converterMoedaBrasileiraParaCentavos(preenchido);
  } catch (erro) {
    if (erro instanceof ErroOnboarding) {
      throw new ErroOnboarding(campo, erro.codigo, erro.message);
    }
    throw erro;
  }

  if (!permiteNegativo && centavos < 0) {
    throw new ErroOnboarding(campo, 'VALOR_NEGATIVO', `${rotulo} não pode ser negativo.`);
  }

  return centavos;
}

export function criarConfiguracaoInicial(
  dados: DadosFormularioOnboarding,
  dataAtual = obterDataCivilHoje(),
): EntradaCalculoDiario {
  const saldoAtual = converterCampoMonetario(
    dados.saldoAtual,
    'saldoAtual',
    'Saldo atual',
    true,
  );
  const contasPendentes = converterCampoMonetario(
    dados.contasPendentes,
    'contasPendentes',
    'Contas pendentes',
    false,
    '0',
  );
  const reserva = converterCampoMonetario(
    dados.reserva,
    'reserva',
    'Reserva',
    false,
    '0',
  );
  const dataProximoRecebimento = dados.dataProximoRecebimento.trim();

  if (!dataProximoRecebimento) {
    throw new ErroOnboarding(
      'dataProximoRecebimento',
      'CAMPO_OBRIGATORIO',
      'A data do próximo recebimento é obrigatória.',
    );
  }

  try {
    calcularQuantidadeDeDiasRestantes(dataAtual, dataProximoRecebimento);
  } catch {
    throw new ErroOnboarding(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'O próximo recebimento deve ser hoje ou uma data futura.',
    );
  }

  return {
    saldoAtual,
    contasPendentes,
    reserva,
    dataAtual,
    dataProximoRecebimento,
    gastosRegistrados: [],
  };
}
