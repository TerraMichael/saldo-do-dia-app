const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Valores monetários são inteiros em centavos. Essa representação impede que
 * operações financeiras dependam da aritmética imprecisa de ponto flutuante.
 */
export type Centavos = number;

export interface EntradaCalculoDiario {
  saldoAtual: Centavos;
  reserva: Centavos;
  contasPendentes: Centavos;
  dataAtual: string;
  dataProximoRecebimento: string;
  gastosRegistrados: readonly Centavos[];
}

export interface ResultadoCalculoDiario {
  valorDisponivel: Centavos;
  limiteDiario: Centavos;
  quantidadeDeDiasRestantes: number;
  totalGastosRegistrados: Centavos;
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
  const totalGastosRegistrados = entrada.gastosRegistrados.reduce((total, gasto, indice) => {
    validarCentavos(gasto, `gastosRegistrados[${indice}]`);
    const novoTotal = total + gasto;
    validarCentavos(novoTotal, 'totalGastosRegistrados');
    return novoTotal;
  }, 0);

  return {
    valorDisponivel,
    limiteDiario: calcularLimiteDiario(valorDisponivel, quantidadeDeDiasRestantes),
    quantidadeDeDiasRestantes,
    totalGastosRegistrados,
  };
}
