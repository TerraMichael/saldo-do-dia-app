import type { Centavos, EntradaCalculoDiario } from '../daily-limit';
import { calcularQuantidadeDeDiasRestantes } from '../daily-limit';
import {
  converterMoedaBrasileiraParaCentavos,
  ErroMoeda,
} from '../../shared/money';

export type CampoNovoCiclo =
  | 'saldoAtual'
  | 'contasPendentes'
  | 'reserva'
  | 'dataProximoRecebimento';

export type CodigoErroNovoCiclo =
  | 'CAMPO_OBRIGATORIO'
  | 'VALOR_INVALIDO'
  | 'VALOR_NEGATIVO'
  | 'DATA_INVALIDA';

export class ErroNovoCiclo extends Error {
  constructor(
    public readonly campo: CampoNovoCiclo,
    public readonly codigo: CodigoErroNovoCiclo,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroNovoCiclo';
  }
}

export interface DadosFormularioNovoCiclo {
  saldoAtual: string;
  contasPendentes?: string;
  reserva?: string;
  dataProximoRecebimento: string;
}

export interface DadosNovoCicloValidados {
  saldoAtual: Centavos;
  contasPendentes: Centavos;
  reserva: Centavos;
  dataProximoRecebimento: string;
}

export interface ResumoCicloEncerrado {
  quantidadeGastos: number;
  totalGasto: Centavos;
}

function converterCampoMonetario(
  valor: string | undefined,
  campo: CampoNovoCiclo,
  rotulo: string,
  permiteNegativo: boolean,
  valorPadrao?: string,
): Centavos {
  const preenchido = valor?.trim() || valorPadrao;
  if (!preenchido) {
    throw new ErroNovoCiclo(
      campo,
      'CAMPO_OBRIGATORIO',
      `${rotulo} é obrigatório.`,
    );
  }

  let centavos: Centavos;
  try {
    centavos = converterMoedaBrasileiraParaCentavos(preenchido);
  } catch (erro) {
    if (erro instanceof ErroMoeda) {
      throw new ErroNovoCiclo(campo, 'VALOR_INVALIDO', erro.message);
    }
    throw erro;
  }

  if (!permiteNegativo && centavos < 0) {
    throw new ErroNovoCiclo(
      campo,
      'VALOR_NEGATIVO',
      `${rotulo} não pode ser negativo.`,
    );
  }
  return centavos;
}

export function validarDadosNovoCiclo(
  dados: DadosFormularioNovoCiclo,
  dataAtual: string,
): DadosNovoCicloValidados {
  const dataProximoRecebimento = dados.dataProximoRecebimento.trim();
  if (!dataProximoRecebimento) {
    throw new ErroNovoCiclo(
      'dataProximoRecebimento',
      'CAMPO_OBRIGATORIO',
      'A data do próximo recebimento é obrigatória.',
    );
  }

  try {
    calcularQuantidadeDeDiasRestantes(dataAtual, dataProximoRecebimento);
  } catch {
    throw new ErroNovoCiclo(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'O próximo recebimento deve ser uma data futura.',
    );
  }

  if (dataProximoRecebimento === dataAtual) {
    throw new ErroNovoCiclo(
      'dataProximoRecebimento',
      'DATA_INVALIDA',
      'O próximo recebimento deve ser depois de hoje.',
    );
  }

  return {
    saldoAtual: converterCampoMonetario(
      dados.saldoAtual,
      'saldoAtual',
      'Saldo atual depois de receber',
      true,
    ),
    contasPendentes: converterCampoMonetario(
      dados.contasPendentes,
      'contasPendentes',
      'Contas pendentes',
      false,
      '0',
    ),
    reserva: converterCampoMonetario(
      dados.reserva,
      'reserva',
      'Reserva protegida',
      false,
      '0',
    ),
    dataProximoRecebimento,
  };
}

export function criarResumoCicloEncerrado(
  configuracao: EntradaCalculoDiario,
): ResumoCicloEncerrado {
  return {
    quantidadeGastos: configuracao.gastosRegistrados.length,
    totalGasto: configuracao.gastosRegistrados.reduce(
      (total, gasto) => total + gasto.valor,
      0,
    ),
  };
}
