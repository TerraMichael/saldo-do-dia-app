import { calcularPlanoDiario, ErroCalculoFinanceiro, type EntradaCalculoDiario, type ResultadoCalculoDiario } from '../features/daily-limit';
import type { DadosPlanejamento } from '../features/cycle-history/model';
import { ErroArmazenamentoPlanejamento, type ArmazenamentoPlanejamento } from './planning-storage';

export type EstadoRestauracaoPlanejamento =
  | { tipo: 'vazio' }
  | { tipo: 'pronto'; dados: DadosPlanejamento; configuracao: EntradaCalculoDiario; resultado: ResultadoCalculoDiario }
  | { tipo: 'expirado'; dados: DadosPlanejamento; configuracao: EntradaCalculoDiario }
  | { tipo: 'erro'; origem: 'leitura' | 'dados-corrompidos' | 'gravacao'; mensagem: string };

function preparar(dadosSalvos: DadosPlanejamento, dataAtual: string) {
  const configuracao = { ...dadosSalvos.cicloAtual.configuracao, dataAtual };
  const dados = { ...dadosSalvos, cicloAtual: { ...dadosSalvos.cicloAtual, configuracao } };
  try {
    return { tipo: 'pronto' as const, dados, configuracao, resultado: calcularPlanoDiario(configuracao) };
  } catch (erro) {
    if (erro instanceof ErroCalculoFinanceiro && erro.codigo === 'ORDEM_DE_DATAS_INVALIDA') {
      return { tipo: 'expirado' as const, dados, configuracao };
    }
    throw erro;
  }
}

async function prepararESalvar(armazenamento: ArmazenamentoPlanejamento, dados: DadosPlanejamento, dataAtual: string): Promise<EstadoRestauracaoPlanejamento> {
  let estado;
  try { estado = preparar(dados, dataAtual); }
  catch { return { tipo: 'erro', origem: 'dados-corrompidos', mensagem: 'Não foi possível calcular o planejamento salvo.' }; }
  if (dados.cicloAtual.configuracao.dataAtual !== dataAtual) {
    try { await armazenamento.salvar(estado.dados); }
    catch { return { tipo: 'erro', origem: 'gravacao', mensagem: 'Não foi possível atualizar a data do planejamento. Tente novamente.' }; }
  }
  return estado;
}

export async function hidratarPlanejamento(armazenamento: ArmazenamentoPlanejamento, dataAtual: string): Promise<EstadoRestauracaoPlanejamento> {
  let dados: DadosPlanejamento | null;
  try { dados = await armazenamento.carregar(); }
  catch (erro) {
    const corrompidos = erro instanceof ErroArmazenamentoPlanejamento && erro.codigo === 'DADOS_INVALIDOS';
    return { tipo: 'erro', origem: corrompidos ? 'dados-corrompidos' : 'leitura', mensagem: corrompidos ? 'Não foi possível carregar os dados. O planejamento salvo parece estar corrompido.' : 'Não foi possível ler o planejamento salvo. Tente novamente.' };
  }
  return dados ? prepararESalvar(armazenamento, dados, dataAtual) : { tipo: 'vazio' };
}

export function atualizarPlanejamentoParaData(armazenamento: ArmazenamentoPlanejamento, dados: DadosPlanejamento, dataAtual: string) {
  return prepararESalvar(armazenamento, dados, dataAtual);
}
