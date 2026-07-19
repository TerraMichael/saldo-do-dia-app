import type { EntradaCalculoDiario } from '../features/daily-limit';
import {
  desserializarPlanejamento,
  desserializarPlanejamentoV1,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
} from './serialization';
import { migrarConfiguracaoV1ParaV2 } from './migration';

export const CHAVE_PLANEJAMENTO = '@saldo-do-dia/planejamento:v2';
export const CHAVE_PLANEJAMENTO_LEGADO = '@saldo-do-dia/planejamento:v1';

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
      let textoV2: string | null;

      try {
        textoV2 = await adaptador.obter(CHAVE_PLANEJAMENTO);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'LEITURA',
          'Não foi possível ler o planejamento salvo.',
          causa,
        );
      }

      if (textoV2 !== null) {
        try {
          return desserializarPlanejamento(textoV2);
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
      }

      let textoV1: string | null;
      try {
        textoV1 = await adaptador.obter(CHAVE_PLANEJAMENTO_LEGADO);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'LEITURA',
          'Não foi possível ler o planejamento salvo.',
          causa,
        );
      }
      if (textoV1 === null) {
        return null;
      }

      let configuracaoMigrada: EntradaCalculoDiario;
      try {
        configuracaoMigrada = migrarConfiguracaoV1ParaV2(
          desserializarPlanejamentoV1(textoV1),
        );
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'DADOS_INVALIDOS',
          'Não foi possível carregar os dados do planejamento.',
          causa,
        );
      }

      try {
        await adaptador.salvar(
          CHAVE_PLANEJAMENTO,
          serializarPlanejamento(configuracaoMigrada),
        );
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento(
          'GRAVACAO',
          'Não foi possível migrar o planejamento salvo. Tente novamente.',
          causa,
        );
      }

      try {
        await adaptador.remover(CHAVE_PLANEJAMENTO_LEGADO);
      } catch {
        // A cópia v2 já foi confirmada; a v1 pode ser removida numa próxima carga.
      }

      return configuracaoMigrada;
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
        await adaptador.remover(CHAVE_PLANEJAMENTO_LEGADO);
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
