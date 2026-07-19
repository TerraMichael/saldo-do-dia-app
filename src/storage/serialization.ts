import type { EntradaCalculoDiario, GastoRegistrado } from '../features/daily-limit';

export const VERSAO_PLANEJAMENTO_PERSISTIDO = 1 as const;

export interface EstadoPersistidoV1 {
  versao: typeof VERSAO_PLANEJAMENTO_PERSISTIDO;
  configuracao: EntradaCalculoDiario;
}

export type CodigoErroSerializacao =
  | 'JSON_INVALIDO'
  | 'VERSAO_DESCONHECIDA'
  | 'DADOS_INVALIDOS';

export class ErroSerializacaoPlanejamento extends Error {
  constructor(
    public readonly codigo: CodigoErroSerializacao,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroSerializacaoPlanejamento';
  }
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function validarInteiroSeguro(
  valor: unknown,
  campo: string,
  permiteNegativo: boolean,
): number {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `${campo} deve ser um número inteiro seguro.`,
    );
  }

  const numero = valor as number;
  if (!permiteNegativo && numero < 0) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `${campo} não pode ser negativo.`,
    );
  }

  return numero;
}

function validarDataCivil(valor: unknown, campo: string): string {
  if (typeof valor !== 'string') {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `${campo} deve ser uma data civil.`,
    );
  }

  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!correspondencia) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `${campo} deve usar o formato AAAA-MM-DD.`,
    );
  }

  const [, anoTexto, mesTexto, diaTexto] = correspondencia;
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const instante = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    instante.getUTCFullYear() !== ano ||
    instante.getUTCMonth() !== mes - 1 ||
    instante.getUTCDate() !== dia
  ) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `${campo} contém uma data inexistente.`,
    );
  }

  return valor;
}

function validarGasto(valor: unknown, indice: number): GastoRegistrado {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `gastosRegistrados[${indice}] deve ser um objeto.`,
    );
  }

  const valorEmCentavos = validarInteiroSeguro(
    valor.valor,
    `gastosRegistrados[${indice}].valor`,
    false,
  );
  if (valorEmCentavos === 0) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `gastosRegistrados[${indice}].valor deve ser maior que zero.`,
    );
  }

  return {
    valor: valorEmCentavos,
    data: validarDataCivil(valor.data, `gastosRegistrados[${indice}].data`),
  };
}

export function validarEstadoPersistido(valor: unknown): EstadoPersistidoV1 {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'O estado persistido deve ser um objeto.',
    );
  }

  if (valor.versao !== VERSAO_PLANEJAMENTO_PERSISTIDO) {
    throw new ErroSerializacaoPlanejamento(
      'VERSAO_DESCONHECIDA',
      'A versão dos dados persistidos não é suportada.',
    );
  }

  if (!ehObjeto(valor.configuracao)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'A configuração persistida está ausente ou é inválida.',
    );
  }

  const configuracao = valor.configuracao;
  if (!Array.isArray(configuracao.gastosRegistrados)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'gastosRegistrados deve ser um array.',
    );
  }

  return {
    versao: VERSAO_PLANEJAMENTO_PERSISTIDO,
    configuracao: {
      saldoAtual: validarInteiroSeguro(configuracao.saldoAtual, 'saldoAtual', true),
      reserva: validarInteiroSeguro(configuracao.reserva, 'reserva', false),
      contasPendentes: validarInteiroSeguro(
        configuracao.contasPendentes,
        'contasPendentes',
        false,
      ),
      dataAtual: validarDataCivil(configuracao.dataAtual, 'dataAtual'),
      dataProximoRecebimento: validarDataCivil(
        configuracao.dataProximoRecebimento,
        'dataProximoRecebimento',
      ),
      gastosRegistrados: configuracao.gastosRegistrados.map(validarGasto),
    },
  };
}

export function serializarPlanejamento(configuracao: EntradaCalculoDiario): string {
  const estado = validarEstadoPersistido({
    versao: VERSAO_PLANEJAMENTO_PERSISTIDO,
    configuracao,
  });
  return JSON.stringify(estado);
}

export function desserializarPlanejamento(texto: string): EntradaCalculoDiario {
  let valor: unknown;

  try {
    valor = JSON.parse(texto) as unknown;
  } catch {
    throw new ErroSerializacaoPlanejamento(
      'JSON_INVALIDO',
      'Os dados persistidos não contêm um JSON válido.',
    );
  }

  return validarEstadoPersistido(valor).configuracao;
}
