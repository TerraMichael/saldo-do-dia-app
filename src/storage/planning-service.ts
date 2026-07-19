import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../features/daily-limit';
import {
  registrarGasto,
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
): Promise<RegistroGastoConcluido> {
  const planejamento = registrarGasto(configuracao, valor, dataAtual);
  await armazenamento.salvar(planejamento.configuracao);
  return planejamento;
}
