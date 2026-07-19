import type {
  CicloAtual,
  CicloEncerrado,
  DadosPlanejamento,
  ResumoInicialCiclo,
} from '../features/cycle-history/model';
import type { EntradaCalculoDiario, GastoRegistrado } from '../features/daily-limit';

export const VERSAO_PLANEJAMENTO_PERSISTIDO = 3 as const;
export const VERSAO_PLANEJAMENTO_V2 = 2 as const;
export const VERSAO_PLANEJAMENTO_LEGADO = 1 as const;

export interface GastoRegistradoV1 { valor: number; data: string }
export interface ConfiguracaoPlanejamentoV1
  extends Omit<EntradaCalculoDiario, 'gastosRegistrados'> {
  gastosRegistrados: readonly GastoRegistradoV1[];
}
export interface EstadoPersistidoV1 {
  versao: typeof VERSAO_PLANEJAMENTO_LEGADO;
  configuracao: ConfiguracaoPlanejamentoV1;
}
export interface EstadoPersistidoV2 {
  versao: typeof VERSAO_PLANEJAMENTO_V2;
  configuracao: EntradaCalculoDiario;
}
export interface EstadoPersistidoV3 {
  versao: typeof VERSAO_PLANEJAMENTO_PERSISTIDO;
  dados: DadosPlanejamento;
}

export type CodigoErroSerializacao =
  | 'JSON_INVALIDO'
  | 'VERSAO_DESCONHECIDA'
  | 'DADOS_INVALIDOS';

export class ErroSerializacaoPlanejamento extends Error {
  constructor(public readonly codigo: CodigoErroSerializacao, mensagem: string) {
    super(mensagem);
    this.name = 'ErroSerializacaoPlanejamento';
  }
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function inteiro(valor: unknown, campo: string, permiteNegativo: boolean): number {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${campo} deve ser um inteiro seguro.`);
  }
  const numero = valor as number;
  if (!permiteNegativo && numero < 0) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${campo} não pode ser negativo.`);
  }
  return numero;
}

export function validarDataCivil(valor: unknown, campo: string): string {
  if (typeof valor !== 'string') {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${campo} deve ser uma data civil.`);
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${campo} deve usar AAAA-MM-DD.`);
  }
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${campo} contém uma data inexistente.`);
  }
  return valor;
}

function gastoBase(valor: Record<string, unknown>, caminho: string) {
  const centavos = inteiro(valor.valor, `${caminho}.valor`, false);
  if (centavos === 0) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho}.valor deve ser maior que zero.`);
  }
  return { valor: centavos, data: validarDataCivil(valor.data, `${caminho}.data`) };
}

function gastoV1(valor: unknown, indice: number): GastoRegistradoV1 {
  if (!ehObjeto(valor)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'Gasto legado inválido.');
  return gastoBase(valor, `gastosRegistrados[${indice}]`);
}

function gastoV2(valor: unknown, indice: number, caminho = 'gastosRegistrados'): GastoRegistrado {
  if (!ehObjeto(valor) || typeof valor.id !== 'string' || !valor.id.trim()) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho}[${indice}].id deve ser não vazio.`);
  }
  return { id: valor.id, ...gastoBase(valor, `${caminho}[${indice}]`) };
}

function configuracao<T>(
  valor: unknown,
  validarGasto: (gasto: unknown, indice: number) => T,
  caminho = 'configuracao',
): Omit<EntradaCalculoDiario, 'gastosRegistrados'> & { gastosRegistrados: readonly T[] } {
  if (!ehObjeto(valor) || !Array.isArray(valor.gastosRegistrados)) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho} é inválida.`);
  }
  const gastos = valor.gastosRegistrados.map(validarGasto);
  const ids = new Set<string>();
  for (const gasto of gastos) {
    if (ehObjeto(gasto) && typeof gasto.id === 'string') {
      if (ids.has(gasto.id)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho} possui IDs de gasto duplicados.`);
      ids.add(gasto.id);
    }
  }
  return {
    saldoAtual: inteiro(valor.saldoAtual, `${caminho}.saldoAtual`, true),
    reserva: inteiro(valor.reserva, `${caminho}.reserva`, false),
    contasPendentes: inteiro(valor.contasPendentes, `${caminho}.contasPendentes`, false),
    dataAtual: validarDataCivil(valor.dataAtual, `${caminho}.dataAtual`),
    dataProximoRecebimento: validarDataCivil(valor.dataProximoRecebimento, `${caminho}.dataProximoRecebimento`),
    gastosRegistrados: gastos,
  };
}

function resumoInicial(valor: unknown, caminho: string): ResumoInicialCiclo | null {
  if (valor === null) return null;
  if (!ehObjeto(valor)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho} é inválido.`);
  return {
    dataInicio: validarDataCivil(valor.dataInicio, `${caminho}.dataInicio`),
    saldoInicial: inteiro(valor.saldoInicial, `${caminho}.saldoInicial`, true),
    reservaInicial: inteiro(valor.reservaInicial, `${caminho}.reservaInicial`, false),
    contasPendentesIniciais: inteiro(valor.contasPendentesIniciais, `${caminho}.contasPendentesIniciais`, false),
    dataProximoRecebimentoPrevista: validarDataCivil(valor.dataProximoRecebimentoPrevista, `${caminho}.dataProximoRecebimentoPrevista`),
  };
}

function idCiclo(valor: unknown, caminho: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', `${caminho}.id deve ser não vazio.`);
  }
  return valor;
}

function cicloAtual(valor: unknown): CicloAtual {
  if (!ehObjeto(valor)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'cicloAtual é inválido.');
  return {
    id: idCiclo(valor.id, 'cicloAtual'),
    inicio: resumoInicial(valor.inicio, 'cicloAtual.inicio'),
    configuracao: configuracao(valor.configuracao, (g, i) => gastoV2(g, i, 'cicloAtual.configuracao.gastosRegistrados'), 'cicloAtual.configuracao'),
  };
}

function cicloEncerrado(valor: unknown, indice: number): CicloEncerrado {
  if (!ehObjeto(valor)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'Ciclo encerrado inválido.');
  const caminho = `ciclosEncerrados[${indice}]`;
  const inicio = resumoInicial(valor.inicio, `${caminho}.inicio`);
  const dataEncerramento = validarDataCivil(valor.dataEncerramento, `${caminho}.dataEncerramento`);
  if (inicio && inicio.dataInicio > dataEncerramento) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'O início não pode ser posterior ao encerramento.');
  }
  return {
    id: idCiclo(valor.id, caminho),
    inicio,
    dataEncerramento,
    configuracaoFinal: configuracao(valor.configuracaoFinal, (g, i) => gastoV2(g, i, `${caminho}.configuracaoFinal.gastosRegistrados`), `${caminho}.configuracaoFinal`),
  };
}

export function validarEstadoPersistidoV1(valor: unknown): EstadoPersistidoV1 {
  if (!ehObjeto(valor) || valor.versao !== 1) throw new ErroSerializacaoPlanejamento('VERSAO_DESCONHECIDA', 'Versão v1 inválida.');
  return { versao: 1, configuracao: configuracao(valor.configuracao, gastoV1) };
}

export function validarEstadoPersistidoV2(valor: unknown): EstadoPersistidoV2 {
  if (!ehObjeto(valor) || valor.versao !== 2) throw new ErroSerializacaoPlanejamento('VERSAO_DESCONHECIDA', 'Versão v2 inválida.');
  return { versao: 2, configuracao: configuracao(valor.configuracao, gastoV2) };
}

export function validarEstadoPersistido(valor: unknown): EstadoPersistidoV3 {
  if (!ehObjeto(valor) || valor.versao !== 3) throw new ErroSerializacaoPlanejamento('VERSAO_DESCONHECIDA', 'A versão persistida não é suportada.');
  if (!ehObjeto(valor.dados) || !Array.isArray(valor.dados.ciclosEncerrados)) {
    throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'Os dados de ciclos são inválidos.');
  }
  const atual = cicloAtual(valor.dados.cicloAtual);
  const encerrados = valor.dados.ciclosEncerrados.map(cicloEncerrado);
  const ids = new Set([atual.id]);
  for (const ciclo of encerrados) {
    if (ids.has(ciclo.id)) throw new ErroSerializacaoPlanejamento('DADOS_INVALIDOS', 'IDs de ciclo duplicados.');
    ids.add(ciclo.id);
  }
  return { versao: 3, dados: { cicloAtual: atual, ciclosEncerrados: encerrados } };
}

function json(texto: string): unknown {
  try { return JSON.parse(texto) as unknown; }
  catch { throw new ErroSerializacaoPlanejamento('JSON_INVALIDO', 'JSON inválido.'); }
}

export function serializarPlanejamento(dados: DadosPlanejamento): string {
  return JSON.stringify(validarEstadoPersistido({ versao: 3, dados }));
}
export function desserializarPlanejamento(texto: string): DadosPlanejamento {
  return validarEstadoPersistido(json(texto)).dados;
}
export function desserializarPlanejamentoV2(texto: string): EntradaCalculoDiario {
  return validarEstadoPersistidoV2(json(texto)).configuracao;
}
export function desserializarPlanejamentoV1(texto: string): ConfiguracaoPlanejamentoV1 {
  return validarEstadoPersistidoV1(json(texto)).configuracao;
}
