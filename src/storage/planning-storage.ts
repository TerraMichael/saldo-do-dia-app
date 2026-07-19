import type { EntradaCalculoDiario } from '../features/daily-limit';
import {
  desserializarPlanejamento,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
} from './serialization';

export const CHAVE_PLANEJAMENTO = '@saldo-do-dia/planejamento:v1';

export interface AdaptadorChaveValor {
  obter(chave: string): Promise<string | null>;
  salvar(chave: string, valor: string): Promise<void>;
  remover(chave: string): Promise<void>;
}

export interface ArmazenamentoPlanejamento {
  carregar(): Promise<EntradaCalculoDiario | null>;
  salvar(configuracao: EntradaCalculoDiario): Promise<void>;
  remover(): Promise<void>;
}

export type CodigoErroArmazenamento =
  | 'LEITURA'
  | 'GRAVACAO'
  | 'REMOCAO'
  | 'DADOS_INVALIDOS';

export class ErroArmazenamentoPlanejamento extends Error {
  constructor(
    public readonly codigo: CodigoErroArmazenamento,
    mensagem: string,
    public readonly causa?: unknown,
  ) {
    super(mensagem);
    this.name = 'ErroArmazenamentoPlanejamento';
  }
}

export function criarArmazenamentoPlanejamento(
  adaptador: AdaptadorChaveValor,
): ArmazenamentoPlanejamento {
  return {
    async carregar() {
      let texto: string | null;

      try {
        texto = await adaptador.obter(CHAVE_PLANEJAMENTO);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'LEITURA',
          'Não foi possível ler o planejamento salvo.',
          causa,
        );
      }

      if (texto === null) {
        return null;
      }

      try {
        return desserializarPlanejamento(texto);
      } catch (causa) {
        if (causa instanceof ErroSerializacaoPlanejamento) {
          throw new ErroArmazenamentoPlanejamento(
            'DADOS_INVALIDOS',
            'Não foi possível carregar os dados do planejamento.',
            causa,
          );
        }
        throw causa;
      }
    },

    async salvar(configuracao) {
      let texto: string;

      try {
        texto = serializarPlanejamento(configuracao);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'DADOS_INVALIDOS',
          'O planejamento contém dados inválidos e não pode ser salvo.',
          causa,
        );
      }

      try {
        await adaptador.salvar(CHAVE_PLANEJAMENTO, texto);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'GRAVACAO',
          'Não foi possível salvar o planejamento. Tente novamente.',
          causa,
        );
      }
    },

    async remover() {
      try {
        await adaptador.remover(CHAVE_PLANEJAMENTO);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'REMOCAO',
          'Não foi possível remover o planejamento. Tente novamente.',
          causa,
        );
      }
    },
  };
}
