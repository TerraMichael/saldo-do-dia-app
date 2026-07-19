import type { Centavos, GastoRegistrado } from '../daily-limit';
import { formatarDataCivilParaExibicao } from '../onboarding/model';
import { formatarCentavosComoMoedaBrasileira } from '../../shared/money';

export interface GastoAgrupado {
  id: string;
  chave: string;
  valor: Centavos;
  indiceOriginal: number;
}

export interface GrupoGastos {
  dataCivil: string;
  dataValida: boolean;
  total: Centavos;
  gastos: readonly GastoAgrupado[];
}

export interface ItemHistorico {
  id: string;
  chave: string;
  valor: string;
}

export interface GrupoHistorico {
  chave: string;
  data: string;
  total: string;
  quantidade: number;
  itens: readonly ItemHistorico[];
}

export interface ApresentacaoHistorico {
  vazio: boolean;
  totalCiclo: string;
  totalHoje: string;
  quantidadeRegistros: number;
  quantidadeRegistrosTexto: string;
  grupos: readonly GrupoHistorico[];
}

function obterOrdemDataCivil(data: string): number | null {
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!correspondencia) {
    return null;
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
    return null;
  }

  return ano * 10_000 + mes * 100 + dia;
}

export function agruparGastosPorData(
  gastos: readonly GastoRegistrado[],
): readonly GrupoGastos[] {
  const grupos = new Map<
    string,
    { total: Centavos; gastos: GastoAgrupado[]; primeiraPosicao: number }
  >();

  gastos.forEach((gasto, indiceOriginal) => {
    const existente = grupos.get(gasto.data);
    const item: GastoAgrupado = {
      id: gasto.id,
      chave: gasto.id,
      valor: gasto.valor,
      indiceOriginal,
    };

    if (existente) {
      existente.total += gasto.valor;
      existente.gastos.push(item);
      return;
    }

    grupos.set(gasto.data, {
      total: gasto.valor,
      gastos: [item],
      primeiraPosicao: indiceOriginal,
    });
  });

  return [...grupos.entries()]
    .map(([dataCivil, grupo]) => ({
      dataCivil,
      dataValida: obterOrdemDataCivil(dataCivil) !== null,
      total: grupo.total,
      gastos: [...grupo.gastos].reverse(),
      primeiraPosicao: grupo.primeiraPosicao,
      ordem: obterOrdemDataCivil(dataCivil),
    }))
    .sort((primeiro, segundo) => {
      if (primeiro.ordem !== null && segundo.ordem !== null) {
        return segundo.ordem - primeiro.ordem;
      }
      if (primeiro.ordem !== null) {
        return -1;
      }
      if (segundo.ordem !== null) {
        return 1;
      }
      return primeiro.primeiraPosicao - segundo.primeiraPosicao;
    })
    .map(({ primeiraPosicao: _primeiraPosicao, ordem: _ordem, ...grupo }) => grupo);
}

function formatarDataHistorico(data: string, dataValida: boolean): string {
  if (!dataValida) {
    return 'Data inválida';
  }

  return formatarDataCivilParaExibicao(data);
}

export function criarApresentacaoHistorico(
  gastos: readonly GastoRegistrado[],
  dataAtual: string,
): ApresentacaoHistorico {
  const grupos = agruparGastosPorData(gastos);
  const totalCiclo = grupos.reduce((total, grupo) => total + grupo.total, 0);
  const totalHoje = gastos.reduce(
    (total, gasto) => total + (gasto.data === dataAtual ? gasto.valor : 0),
    0,
  );
  const quantidadeRegistros = gastos.length;

  return {
    vazio: quantidadeRegistros === 0,
    totalCiclo: formatarCentavosComoMoedaBrasileira(totalCiclo),
    totalHoje: formatarCentavosComoMoedaBrasileira(totalHoje),
    quantidadeRegistros,
    quantidadeRegistrosTexto: `${quantidadeRegistros} ${
      quantidadeRegistros === 1 ? 'registro' : 'registros'
    }`,
    grupos: grupos.map((grupo) => ({
      chave: grupo.dataCivil,
      data: formatarDataHistorico(grupo.dataCivil, grupo.dataValida),
      total: formatarCentavosComoMoedaBrasileira(grupo.total),
      quantidade: grupo.gastos.length,
      itens: grupo.gastos.map((gasto) => ({
        id: gasto.id,
        chave: gasto.chave,
        valor: formatarCentavosComoMoedaBrasileira(gasto.valor),
      })),
    })),
  };
}
