import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../features/daily-limit';
import {
  editarGasto,
  excluirGasto,
  registrarGasto,
  type EdicaoGastoConcluida,
  type ExclusaoGastoConcluida,
  type GeradorIdGasto,
  type RegistroGastoConcluido,
} from '../features/expenses';
import type { ArmazenamentoPlanejamento } from './planning-storage';

export interface PlanejamentoConfirmado {
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
}

export async function confirmarPlanejamentoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
): Promise<PlanejamentoConfirmado> {
  const resultado = calcularPlanoDiario(configuracao);
  await armazenamento.salvar(configuracao);
  return { configuracao, resultado };
}

export async function registrarGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  valor: string,
  dataAtual: string,
  gerarId: GeradorIdGasto,
): Promise<RegistroGastoConcluido> {
  const planejamento = registrarGasto(configuracao, valor, dataAtual, gerarId);
  await armazenamento.salvar(planejamento.configuracao);
  return planejamento;
}

export async function editarGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  id: string,
  novoValor: string,
  dataAtual: string,
): Promise<EdicaoGastoConcluida> {
  const planejamento = editarGasto(configuracao, id, novoValor, dataAtual);
  if (planejamento.alterado) {
    await armazenamento.salvar(planejamento.configuracao);
  }
  return planejamento;
}

export async function excluirGastoPersistido(
  armazenamento: ArmazenamentoPlanejamento,
  configuracao: EntradaCalculoDiario,
  id: string,
  dataAtual: string,
): Promise<ExclusaoGastoConcluida> {
  const planejamento = excluirGasto(configuracao, id, dataAtual);
  await armazenamento.salvar(planejamento.configuracao);
  return planejamento;
}
