import { adaptadorAsyncStorage } from '../../storage/async-storage-adapter';
import type { AdaptadorChaveValor } from '../../storage/planning-storage';
import {
  ESTADO_TUTORIAL_PADRAO,
  validarEstadoTutorial,
  type EstadoTutorialV1,
} from './model';

export const CHAVE_TUTORIAL = '@saldo-do-dia/tutorial:v1';

export interface ArmazenamentoTutorial {
  carregar(): Promise<EstadoTutorialV1>;
  salvar(estado: EstadoTutorialV1): Promise<void>;
}

export function criarArmazenamentoTutorial(
  adaptador: AdaptadorChaveValor,
): ArmazenamentoTutorial {
  return {
    async carregar() {
      const valor = await adaptador.obter(CHAVE_TUTORIAL);
      if (valor === null) return ESTADO_TUTORIAL_PADRAO;

      let documento: unknown;
      try {
        documento = JSON.parse(valor);
      } catch {
        throw new Error('Não foi possível interpretar os dados educativos.');
      }
      return validarEstadoTutorial(documento);
    },
    salvar(estado) {
      const validado = validarEstadoTutorial(estado);
      return adaptador.salvar(CHAVE_TUTORIAL, JSON.stringify(validado));
    },
  };
}

export const armazenamentoTutorial = criarArmazenamentoTutorial(
  adaptadorAsyncStorage,
);

