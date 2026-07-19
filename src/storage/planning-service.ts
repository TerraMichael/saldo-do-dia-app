import { calcularPlanoDiario, type EntradaCalculoDiario, type ResultadoCalculoDiario } from '../features/daily-limit';
import { criarDadosPrimeiroCiclo, criarResumoInicialCiclo, type DadosPlanejamento, type GeradorIdCiclo } from '../features/cycle-history/model';
import { editarGasto, excluirGasto, registrarGasto, type EdicaoGastoConcluida, type ExclusaoGastoConcluida, type GeradorIdGasto, type RegistroGastoConcluido } from '../features/expenses';
import { iniciarNovoCiclo, type DadosFormularioNovoCiclo, type NovoCicloCriado } from '../features/cycle';
import type { ArmazenamentoPlanejamento } from './planning-storage';

export interface PlanejamentoConfirmado {
  dados: DadosPlanejamento;
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
}

function comConfiguracaoAtual(dados: DadosPlanejamento, configuracao: EntradaCalculoDiario): DadosPlanejamento {
  return {
    cicloAtual: { ...dados.cicloAtual, configuracao },
    ciclosEncerrados: dados.ciclosEncerrados,
  };
}

export async function confirmarPlanejamentoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  dadosAtuais: DadosPlanejamento | null,
  gerarId: GeradorIdCiclo,
): Promise<PlanejamentoConfirmado> {
  const dados = dadosAtuais
    ? comConfiguracaoAtual(dadosAtuais, configuracao)
    : criarDadosPrimeiroCiclo(configuracao, gerarId);
  const resultado = calcularPlanoDiario(configuracao);
  await armazenamento.salvar(dados);
  return { dados, configuracao, resultado };
}

export async function registrarGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  dados: DadosPlanejamento,
  valor: string,
  dataAtual: string,
  gerarId: GeradorIdGasto,
): Promise<RegistroGastoConcluido & { dados: DadosPlanejamento }> {
  const planejamento = registrarGasto(dados.cicloAtual.configuracao, valor, dataAtual, gerarId);
  const novosDados = comConfiguracaoAtual(dados, planejamento.configuracao);
  await armazenamento.salvar(novosDados);
  return { ...planejamento, dados: novosDados };
}

export async function editarGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  dados: DadosPlanejamento,
  id: string,
  novoValor: string,
  dataAtual: string,
): Promise<EdicaoGastoConcluida & { dados: DadosPlanejamento }> {
  const planejamento = editarGasto(dados.cicloAtual.configuracao, id, novoValor, dataAtual);
  const novosDados = planejamento.alterado ? comConfiguracaoAtual(dados, planejamento.configuracao) : dados;
  if (planejamento.alterado) await armazenamento.salvar(novosDados);
  return { ...planejamento, dados: novosDados };
}

export async function excluirGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  dados: DadosPlanejamento,
  id: string,
  dataAtual: string,
): Promise<ExclusaoGastoConcluida & { dados: DadosPlanejamento }> {
  const planejamento = excluirGasto(dados.cicloAtual.configuracao, id, dataAtual);
  const novosDados = comConfiguracaoAtual(dados, planejamento.configuracao);
  await armazenamento.salvar(novosDados);
  return { ...planejamento, dados: novosDados };
}

export async function iniciarNovoCicloPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  dadosAtuais: DadosPlanejamento,
  formulario: DadosFormularioNovoCiclo,
  dataAtual: string,
  gerarId: GeradorIdCiclo,
): Promise<NovoCicloCriado & { dados: DadosPlanejamento }> {
  const planejamento = iniciarNovoCiclo(formulario, dataAtual);
  const novosDados: DadosPlanejamento = {
    cicloAtual: {
      id: gerarId(),
      inicio: criarResumoInicialCiclo(planejamento.configuracao),
      configuracao: planejamento.configuracao,
    },
    ciclosEncerrados: [
      ...dadosAtuais.ciclosEncerrados,
      {
        id: dadosAtuais.cicloAtual.id,
        inicio: dadosAtuais.cicloAtual.inicio,
        dataEncerramento: dataAtual,
        configuracaoFinal: {
          ...dadosAtuais.cicloAtual.configuracao,
          gastosRegistrados: dadosAtuais.cicloAtual.configuracao.gastosRegistrados.map((gasto) => ({ ...gasto })),
        },
      },
    ],
  };
  await armazenamento.salvar(novosDados);
  return { ...planejamento, dados: novosDados };
}
