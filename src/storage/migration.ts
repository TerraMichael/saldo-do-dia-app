import type { EntradaCalculoDiario } from '../features/daily-limit';
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
