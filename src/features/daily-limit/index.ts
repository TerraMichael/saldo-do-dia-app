const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Valores monetários são inteiros em centavos. Essa representação impede que
 * operações financeiras dependam da aritmética imprecisa de ponto flutuante.
 */
export type Centavos = number;

export interface GastoRegistrado {
  id: string;
  valor: Centavos;
  data: string;
}

export interface EntradaCalculoDiario {
  saldoAtual: Centavos;
  reserva: Centavos;
  contasPendentes: Centavos;
  dataAtual: string;
  dataProximoRecebimento: string;
  gastosRegistrados: readonly GastoRegistrado[];
}

export interface ResultadoCalculoDiario {
  valorDisponivel: Centavos;
  limiteDiario: Centavos;
  quantidadeDeDiasRestantes: number;
  totalGastosRegistrados: Centavos;
  totalGastosHoje: Centavos;
  limitePlanejadoHoje: Centavos;
  restanteHoje: Centavos;
  excedenteHoje: Centavos;
  quantidadeDeDiasFuturos: number;
  limiteDiasFuturos: Centavos | null;
}

export type CodigoErroCalculoFinanceiro =
  | 'DATA_INVALIDA'
  | 'ORDEM_DE_DATAS_INVALIDA'
  | 'VALOR_MONETARIO_INVALIDO';

export class ErroCalculoFinanceiro extends Error {
  constructor(
    public readonly codigo: CodigoErroCalculoFinanceiro,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroCalculoFinanceiro';
  }
}

function validarCentavos(valor: Centavos, campo: string): void {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroCalculoFinanceiro(
      'VALOR_MONETARIO_INVALIDO',
      `${campo} deve ser informado como um número inteiro de centavos.`,
    );
  }
}

function converterData(data: string, campo: string): number {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);

  if (!correspondencia) {
    throw new ErroCalculoFinanceiro(
      'DATA_INVALIDA',
      `${campo} deve ser uma data válida no formato AAAA-MM-DD.`,
    );
  }

  const [, anoTexto, mesTexto, diaTexto] = correspondencia;
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const instante = Date.UTC(ano, mes - 1, dia);
  const dataConvertida = new Date(instante);

  if (
    dataConvertida.getUTCFullYear() !== ano ||
    dataConvertida.getUTCMonth() !== mes - 1 ||
    dataConvertida.getUTCDate() !== dia
  ) {
    throw new ErroCalculoFinanceiro('DATA_INVALIDA', `${campo} contém uma data inexistente.`);
  }

  return instante;
}

export function calcularValorDisponivel(
  saldoAtual: Centavos,
  reserva: Centavos,
  contasPendentes: Centavos,
): Centavos {
  validarCentavos(saldoAtual, 'saldoAtual');
  validarCentavos(reserva, 'reserva');
  validarCentavos(contasPendentes, 'contasPendentes');

  const valorDisponivel = saldoAtual - reserva - contasPendentes;
  validarCentavos(valorDisponivel, 'valorDisponivel');
  return valorDisponivel;
}

export function calcularQuantidadeDeDiasRestantes(
  dataAtual: string,
  dataProximoRecebimento: string,
): number {
  const inicio = converterData(dataAtual, 'dataAtual');
  const recebimento = converterData(dataProximoRecebimento, 'dataProximoRecebimento');
  const diferencaEmDias = (recebimento - inicio) / MILISSEGUNDOS_POR_DIA;

  if (diferencaEmDias < 0) {
    throw new ErroCalculoFinanceiro(
      'ORDEM_DE_DATAS_INVALIDA',
      'A data do próximo recebimento não pode ser anterior à data atual.',
    );
  }

  // No dia do recebimento ainda existe um período de orçamento a considerar.
  return Math.max(1, diferencaEmDias);
}

export function calcularLimiteDiario(
  valorDisponivel: Centavos,
  quantidadeDeDiasRestantes: number,
): Centavos {
  validarCentavos(valorDisponivel, 'valorDisponivel');

  if (!Number.isSafeInteger(quantidadeDeDiasRestantes) || quantidadeDeDiasRestantes < 1) {
    throw new ErroCalculoFinanceiro(
      'DATA_INVALIDA',
      'A quantidade de dias restantes deve ser um número inteiro maior ou igual a um.',
    );
  }

  // Arredondar para baixo garante que a divisão nunca disponibilize mais que o total.
  return Math.floor(valorDisponivel / quantidadeDeDiasRestantes);
}

export function calcularPlanoDiario(entrada: EntradaCalculoDiario): ResultadoCalculoDiario {
  const valorDisponivel = calcularValorDisponivel(
    entrada.saldoAtual,
    entrada.reserva,
    entrada.contasPendentes,
  );
  const quantidadeDeDiasRestantes = calcularQuantidadeDeDiasRestantes(
    entrada.dataAtual,
    entrada.dataProximoRecebimento,
  );
  const { totalGastosRegistrados, totalGastosHoje } = entrada.gastosRegistrados.reduce(
    (totais, gasto, indice) => {
    validarCentavos(gasto.valor, `gastosRegistrados[${indice}].valor`);
    converterData(gasto.data, `gastosRegistrados[${indice}].data`);
    const novoTotal = totais.totalGastosRegistrados + gasto.valor;
    validarCentavos(novoTotal, 'totalGastosRegistrados');
    const novoTotalHoje =
      gasto.data === entrada.dataAtual ? totais.totalGastosHoje + gasto.valor : totais.totalGastosHoje;
    validarCentavos(novoTotalHoje, 'totalGastosHoje');
    return {
      totalGastosRegistrados: novoTotal,
      totalGastosHoje: novoTotalHoje,
    };
  }, { totalGastosRegistrados: 0, totalGastosHoje: 0 });
  const valorDisponivelNoInicioDoDia = valorDisponivel + totalGastosHoje;
  validarCentavos(valorDisponivelNoInicioDoDia, 'valorDisponivelNoInicioDoDia');
  const limitePlanejadoHoje = calcularLimiteDiario(
    valorDisponivelNoInicioDoDia,
    quantidadeDeDiasRestantes,
  );
  const restanteHoje = Math.max(0, limitePlanejadoHoje - totalGastosHoje);
  const limitePermitidoHoje = Math.max(0, limitePlanejadoHoje);
  const excedenteHoje = Math.max(0, totalGastosHoje - limitePermitidoHoje);
  validarCentavos(restanteHoje, 'restanteHoje');
  validarCentavos(excedenteHoje, 'excedenteHoje');
  const quantidadeDeDiasFuturos = Math.max(0, quantidadeDeDiasRestantes - 1);
  const valorDisponivelParaDiasFuturos = valorDisponivel - restanteHoje;
  validarCentavos(valorDisponivelParaDiasFuturos, 'valorDisponivelParaDiasFuturos');
  const limiteDiasFuturos =
    quantidadeDeDiasFuturos > 0
      ? calcularLimiteDiario(valorDisponivelParaDiasFuturos, quantidadeDeDiasFuturos)
      : null;

  return {
    valorDisponivel,
    limiteDiario: limitePlanejadoHoje,
    quantidadeDeDiasRestantes,
    totalGastosRegistrados,
    totalGastosHoje,
    limitePlanejadoHoje,
    restanteHoje,
    excedenteHoje,
    quantidadeDeDiasFuturos,
    limiteDiasFuturos,
  };
}
