import {
  ehPreferenciaAparencia,
  PREFERENCIA_APARENCIA_PADRAO,
  type PreferenciaAparencia,
} from '../ui/theme/appearance';
import { adaptadorAsyncStorage } from './async-storage-adapter';
import type { AdaptadorChaveValor } from './planning-storage';

export const CHAVE_APARENCIA = '@saldo-do-dia/aparencia:v1';

export interface ArmazenamentoAparencia {
  carregar(): Promise<PreferenciaAparencia>;
  salvar(preferencia: PreferenciaAparencia): Promise<void>;
}

export async function carregarAparenciaComFallback(
  armazenamento: ArmazenamentoAparencia,
): Promise<PreferenciaAparencia> {
  try {
    return await armazenamento.carregar();
  } catch {
    return PREFERENCIA_APARENCIA_PADRAO;
  }
}

export function criarArmazenamentoAparencia(
  adaptador: AdaptadorChaveValor,
): ArmazenamentoAparencia {
  return {
    async carregar() {
      const valor = await adaptador.obter(CHAVE_APARENCIA);
      if (valor === null) return PREFERENCIA_APARENCIA_PADRAO;

      try {
        const preferencia: unknown = JSON.parse(valor);
        return ehPreferenciaAparencia(preferencia)
          ? preferencia
          : PREFERENCIA_APARENCIA_PADRAO;
      } catch {
        return PREFERENCIA_APARENCIA_PADRAO;
      }
    },
    salvar(preferencia) {
      return adaptador.salvar(CHAVE_APARENCIA, JSON.stringify(preferencia));
    },
  };
}

export const armazenamentoAparencia = criarArmazenamentoAparencia(
  adaptadorAsyncStorage,
);
