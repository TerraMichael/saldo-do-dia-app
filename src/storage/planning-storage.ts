import type { DadosPlanejamento } from '../features/cycle-history/model';
import {
  desserializarPlanejamento,
  desserializarPlanejamentoV1,
  desserializarPlanejamentoV2,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
} from './serialization';
import {
  migrarConfiguracaoV1ParaV2,
  migrarConfiguracaoV2ParaV3,
} from './migration';

export const CHAVE_PLANEJAMENTO = '@saldo-do-dia/planejamento:v3';
export const CHAVE_PLANEJAMENTO_V2 = '@saldo-do-dia/planejamento:v2';
export const CHAVE_PLANEJAMENTO_LEGADO = '@saldo-do-dia/planejamento:v1';

export interface AdaptadorChaveValor {
  obter(chave: string): Promise<string | null>;
  salvar(chave: string, valor: string): Promise<void>;
  remover(chave: string): Promise<void>;
}
export interface ArmazenamentoPlanejamento {
  carregar(): Promise<DadosPlanejamento | null>;
  salvar(dados: DadosPlanejamento): Promise<void>;
  remover(): Promise<void>;
}
export type CodigoErroArmazenamento = 'LEITURA' | 'GRAVACAO' | 'REMOCAO' | 'DADOS_INVALIDOS';
export class ErroArmazenamentoPlanejamento extends Error {
  constructor(public readonly codigo: CodigoErroArmazenamento, mensagem: string, public readonly causa?: unknown) {
    super(mensagem);
    this.name = 'ErroArmazenamentoPlanejamento';
  }
}

export function criarArmazenamentoPlanejamento(adaptador: AdaptadorChaveValor): ArmazenamentoPlanejamento {
  async function obter(chave: string) {
    try { return await adaptador.obter(chave); }
    catch (causa) { throw new ErroArmazenamentoPlanejamento('LEITURA', 'Não foi possível ler o planejamento salvo.', causa); }
  }
  async function migrarESalvar(dados: DadosPlanejamento, chaveAntiga: string) {
    try { await adaptador.salvar(CHAVE_PLANEJAMENTO, serializarPlanejamento(dados)); }
    catch (causa) { throw new ErroArmazenamentoPlanejamento('GRAVACAO', 'Não foi possível migrar o planejamento salvo. Tente novamente.', causa); }
    try { await adaptador.remover(chaveAntiga); } catch { /* v3 já está confirmada */ }
    return dados;
  }
  return {
    async carregar() {
      const textoV3 = await obter(CHAVE_PLANEJAMENTO);
      if (textoV3 !== null) {
        try { return desserializarPlanejamento(textoV3); }
        catch (causa) { throw new ErroArmazenamentoPlanejamento('DADOS_INVALIDOS', 'Não foi possível carregar os dados do planejamento.', causa); }
      }
      const textoV2 = await obter(CHAVE_PLANEJAMENTO_V2);
      if (textoV2 !== null) {
        try {
          return await migrarESalvar(
            migrarConfiguracaoV2ParaV3(desserializarPlanejamentoV2(textoV2)),
            CHAVE_PLANEJAMENTO_V2,
          );
        } catch (causa) {
          if (causa instanceof ErroArmazenamentoPlanejamento) throw causa;
          throw new ErroArmazenamentoPlanejamento('DADOS_INVALIDOS', 'Não foi possível carregar os dados do planejamento.', causa);
        }
      }
      const textoV1 = await obter(CHAVE_PLANEJAMENTO_LEGADO);
      if (textoV1 === null) return null;
      try {
        const v2 = migrarConfiguracaoV1ParaV2(desserializarPlanejamentoV1(textoV1));
        return await migrarESalvar(migrarConfiguracaoV2ParaV3(v2), CHAVE_PLANEJAMENTO_LEGADO);
      } catch (causa) {
        if (causa instanceof ErroArmazenamentoPlanejamento) throw causa;
        throw new ErroArmazenamentoPlanejamento('DADOS_INVALIDOS', 'Não foi possível carregar os dados do planejamento.', causa);
      }
    },
    async salvar(dados) {
      try { await adaptador.salvar(CHAVE_PLANEJAMENTO, serializarPlanejamento(dados)); }
      catch (causa) {
        const codigo = causa instanceof ErroSerializacaoPlanejamento ? 'DADOS_INVALIDOS' : 'GRAVACAO';
        throw new ErroArmazenamentoPlanejamento(codigo, 'Não foi possível salvar o planejamento. Tente novamente.', causa);
      }
    },
    async remover() {
      try {
        await adaptador.remover(CHAVE_PLANEJAMENTO_LEGADO);
        await adaptador.remover(CHAVE_PLANEJAMENTO_V2);
        await adaptador.remover(CHAVE_PLANEJAMENTO);
      } catch (causa) {
        throw new ErroArmazenamentoPlanejamento('REMOCAO', 'Não foi possível remover o planejamento. Tente novamente.', causa);
      }
    },
  };
}
