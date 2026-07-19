import {
  calcularPlanoDiario,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../features/daily-limit';
import {
  ErroArmazenamentoPlanejamento,
  type ArmazenamentoPlanejamento,
} from './planning-storage';

export type EstadoRestauracaoPlanejamento =
  | { tipo: 'vazio' }
  | {
      tipo: 'pronto';
      configuracao: EntradaCalculoDiario;
      resultado: ResultadoCalculoDiario;
    }
  | { tipo: 'expirado'; configuracao: EntradaCalculoDiario }
  | {
      tipo: 'erro';
      origem: 'leitura' | 'dados-corrompidos' | 'gravacao';
      mensagem: string;
    };

function prepararConfiguracao(
  configuracaoSalva: EntradaCalculoDiario,
  dataAtual: string,
): Exclude<EstadoRestauracaoPlanejamento, { tipo: 'vazio' | 'erro' }> {
  const configuracao = {
    ...configuracaoSalva,
    dataAtual,
  };

  try {
    return {
      tipo: 'pronto',
      configuracao,
      resultado: calcularPlanoDiario(configuracao),
    };
  } catch (erro) {
    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'ORDEM_DE_DATAS_INVALIDA'
    ) {
      return { tipo: 'expirado', configuracao };
    }

    throw erro;
  }
}

async function prepararESalvarMudancaDeData(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  dataAtual: string,
): Promise<EstadoRestauracaoPlanejamento> {
  let estado: Exclude<EstadoRestauracaoPlanejamento, { tipo: 'vazio' | 'erro' }>;

  try {
    estado = prepararConfiguracao(configuracao, dataAtual);
  } catch {
    return {
      tipo: 'erro',
      origem: 'dados-corrompidos',
      mensagem: 'Não foi possível calcular o planejamento salvo.',
    };
  }

  if (configuracao.dataAtual !== dataAtual) {
    try {
      await armazenamento.salvar(estado.configuracao);
    } catch {
      return {
        tipo: 'erro',
        origem: 'gravacao',
        mensagem: 'Não foi possível atualizar a data do planejamento. Tente novamente.',
      };
    }
  }

  return estado;
}

export async function hidratarPlanejamento(
  armazenamento: ArmazenamentoPlanejamento,
  dataAtual: string,
): Promise<EstadoRestauracaoPlanejamento> {
  let configuracao: EntradaCalculoDiario | null;

  try {
    configuracao = await armazenamento.carregar();
  } catch (erro) {
    const dadosCorrompidos =
      erro instanceof ErroArmazenamentoPlanejamento &&
      erro.codigo === 'DADOS_INVALIDOS';
    return {
      tipo: 'erro',
      origem: dadosCorrompidos ? 'dados-corrompidos' : 'leitura',
      mensagem: dadosCorrompidos
        ? 'Não foi possível carregar os dados. O planejamento salvo parece estar corrompido.'
        : 'Não foi possível ler o planejamento salvo. Tente novamente.',
    };
  }

  if (!configuracao) {
    return { tipo: 'vazio' };
  }

  return prepararESalvarMudancaDeData(armazenamento, configuracao, dataAtual);
}

export function atualizarPlanejamentoParaData(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  dataAtual: string,
): Promise<EstadoRestauracaoPlanejamento> {
  return prepararESalvarMudancaDeData(armazenamento, configuracao, dataAtual);
}
