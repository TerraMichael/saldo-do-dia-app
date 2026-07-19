import type { EntradaCalculoDiario } from '../features/daily-limit';
import type { DadosPlanejamento } from '../features/cycle-history/model';
import type { ConfiguracaoPlanejamentoV1 } from './serialization';

export function criarIdDeterministicoGastoLegado(
  indiceOriginal: number,
  data: string,
  valor: number,
): string {
  return `legado:${indiceOriginal}:${data}:${valor}`;
}

export function migrarConfiguracaoV1ParaV2(
  configuracao: ConfiguracaoPlanejamentoV1,
): EntradaCalculoDiario {
  return {
    ...configuracao,
    gastosRegistrados: configuracao.gastosRegistrados.map((gasto, indice) => ({
      id: criarIdDeterministicoGastoLegado(indice, gasto.data, gasto.valor),
      valor: gasto.valor,
      data: gasto.data,
    })),
  };
}

export function criarIdDeterministicoCicloMigrado(
  configuracao: EntradaCalculoDiario,
): string {
  return `ciclo-legado:${configuracao.dataAtual}:${configuracao.dataProximoRecebimento}`;
}

export function migrarConfiguracaoV2ParaV3(
  configuracao: EntradaCalculoDiario,
): DadosPlanejamento {
  return {
    cicloAtual: {
      id: criarIdDeterministicoCicloMigrado(configuracao),
      inicio: null,
      configuracao,
    },
    ciclosEncerrados: [],
  };
}
