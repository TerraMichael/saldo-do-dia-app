import type {
  EntradaCalculoDiario,
  GastoRegistrado,
} from '../features/daily-limit';

export const VERSAO_PLANEJAMENTO_PERSISTIDO = 2 as const;
export const VERSAO_PLANEJAMENTO_LEGADO = 1 as const;

export interface GastoRegistradoV1 {
  valor: number;
  data: string;
}

export interface ConfiguracaoPlanejamentoV1
  extends Omit<EntradaCalculoDiario, 'gastosRegistrados'> {
  gastosRegistrados: readonly GastoRegistradoV1[];
}

export interface EstadoPersistidoV1 {
  versao: typeof VERSAO_PLANEJAMENTO_LEGADO;
  configuracao: ConfiguracaoPlanejamentoV1;
}

export interface EstadoPersistidoV2 {
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

function validarValorGasto(
  valor: Record<string, unknown>,
  indice: number,
): { valor: number; data: string } {
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

function validarGastoV1(valor: unknown, indice: number): GastoRegistradoV1 {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `gastosRegistrados[${indice}] deve ser um objeto.`,
    );
  }
  return validarValorGasto(valor, indice);
}

function validarGastoV2(valor: unknown, indice: number): GastoRegistrado {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `gastosRegistrados[${indice}] deve ser um objeto.`,
    );
  }
  if (typeof valor.id !== 'string' || !valor.id.trim()) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      `gastosRegistrados[${indice}].id deve ser uma string não vazia.`,
    );
  }

  return { id: valor.id, ...validarValorGasto(valor, indice) };
}

function validarConfiguracao<TGasto>(
  valor: unknown,
  validarGasto: (gasto: unknown, indice: number) => TGasto,
): Omit<EntradaCalculoDiario, 'gastosRegistrados'> & {
  gastosRegistrados: readonly TGasto[];
} {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'A configuração persistida está ausente ou é inválida.',
    );
  }
  if (!Array.isArray(valor.gastosRegistrados)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'gastosRegistrados deve ser um array.',
    );
  }

  return {
    saldoAtual: validarInteiroSeguro(valor.saldoAtual, 'saldoAtual', true),
    reserva: validarInteiroSeguro(valor.reserva, 'reserva', false),
    contasPendentes: validarInteiroSeguro(
      valor.contasPendentes,
      'contasPendentes',
      false,
    ),
    dataAtual: validarDataCivil(valor.dataAtual, 'dataAtual'),
    dataProximoRecebimento: validarDataCivil(
      valor.dataProximoRecebimento,
      'dataProximoRecebimento',
    ),
    gastosRegistrados: valor.gastosRegistrados.map(validarGasto),
  };
}

export function validarEstadoPersistidoV1(valor: unknown): EstadoPersistidoV1 {
  if (!ehObjeto(valor)) {
    throw new ErroSerializacaoPlanejamento(
      'DADOS_INVALIDOS',
      'O estado persistido deve ser um objeto.',
    );
  }
  if (valor.versao !== VERSAO_PLANEJAMENTO_LEGADO) {
    throw new ErroSerializacaoPlanejamento(
      'VERSAO_DESCONHECIDA',
      'A versão legada dos dados persistidos não é suportada.',
    );
  }

  return {
    versao: VERSAO_PLANEJAMENTO_LEGADO,
    configuracao: validarConfiguracao(valor.configuracao, validarGastoV1),
  };
}

export function validarEstadoPersistido(valor: unknown): EstadoPersistidoV2 {
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

  const configuracao = validarConfiguracao(
    valor.configuracao,
    validarGastoV2,
  );
  const ids = new Set<string>();
  configuracao.gastosRegistrados.forEach((gasto, indice) => {
    if (ids.has(gasto.id)) {
      throw new ErroSerializacaoPlanejamento(
        'DADOS_INVALIDOS',
        `gastosRegistrados[${indice}].id está duplicado.`,
      );
    }
    ids.add(gasto.id);
  });

  return {
    versao: VERSAO_PLANEJAMENTO_PERSISTIDO,
    configuracao,
  };
}

function interpretarJson(texto: string): unknown {
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new ErroSerializacaoPlanejamento(
      'JSON_INVALIDO',
      'Os dados persistidos não contêm um JSON válido.',
    );
  }
}

export function serializarPlanejamento(configuracao: EntradaCalculoDiario): string {
  return JSON.stringify(
    validarEstadoPersistido({
      versao: VERSAO_PLANEJAMENTO_PERSISTIDO,
      configuracao,
    }),
  );
}

export function desserializarPlanejamento(texto: string): EntradaCalculoDiario {
  return validarEstadoPersistido(interpretarJson(texto)).configuracao;
}

export function desserializarPlanejamentoV1(
  texto: string,
): ConfiguracaoPlanejamentoV1 {
  return validarEstadoPersistidoV1(interpretarJson(texto)).configuracao;
}
