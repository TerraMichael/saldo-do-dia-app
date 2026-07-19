import {
  calcularQuantidadeDeDiasRestantes,
  type Centavos,
  type EntradaCalculoDiario,
} from '../daily-limit';

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

const FORMATO_MOEDA_BRASILEIRA = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;
const FORMATO_DATA_CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

export function converterMoedaBrasileiraParaCentavos(valor: string): Centavos {
  const normalizado = valor.trim().replace(/^R\$\s?/, '').replace(/\s/g, '');

  if (!normalizado || !FORMATO_MOEDA_BRASILEIRA.test(normalizado)) {
    throw new ErroOnboarding(
      'saldoAtual',
      'VALOR_INVALIDO',
      'Informe um valor válido, como R$ 1.234,56.',
    );
  }

  const negativo = normalizado.startsWith('-');
  const semSinal = negativo ? normalizado.slice(1) : normalizado;
  const [reaisTexto, centavosTexto = ''] = semSinal.split(',');
  const reais = Number(reaisTexto.replace(/\./g, ''));
  const centavos = Number(centavosTexto.padEnd(2, '0'));
  const resultado = (reais * 100 + centavos) * (negativo ? -1 : 1);

  if (!Number.isSafeInteger(resultado)) {
    throw new ErroOnboarding(
      'saldoAtual',
      'VALOR_INVALIDO',
      'O valor informado é grande demais.',
    );
  }

  return resultado;
}

export function formatarCentavosComoMoedaBrasileira(valor: Centavos): string {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroOnboarding('saldoAtual', 'VALOR_INVALIDO', 'O valor monetário é inválido.');
  }

  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  const reais = Math.floor(absoluto / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (absoluto % 100).toString().padStart(2, '0');

  return `R$ ${negativo ? '-' : ''}${reais},${centavos}`;
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
