import { performance } from 'node:perf_hooks';
import { calcularPlanoDiario, type EntradaCalculoDiario } from '../src/features/daily-limit';
import { criarApresentacaoHistorico } from '../src/features/history';
import { desserializarPlanejamento, serializarPlanejamento } from '../src/storage/serialization';

for (const count of [1_000, 10_000]) {
  const configuration: EntradaCalculoDiario = {
    saldoAtual: 50_000_000,
    reserva: 0,
    contasPendentes: 0,
    dataAtual: '2026-01-01',
    dataProximoRecebimento: '2026-02-01',
    gastosRegistrados: Array.from({ length: count }, (_, index) => ({
      id: `expense-${index}`,
      valor: (index % 100) + 1,
      data: index % 2 ? '2026-01-01' : '2025-12-31',
    })),
  };
  const memoryBefore = process.memoryUsage().heapUsed;
  const started = performance.now();
  calcularPlanoDiario(configuration);
  criarApresentacaoHistorico(configuration.gastosRegistrados, configuration.dataAtual);
  desserializarPlanejamento(serializarPlanejamento({
    cicloAtual: { id: 'current', inicio: null, configuracao: configuration },
    ciclosEncerrados: [],
  }));
  const elapsed = performance.now() - started;
  const memory = process.memoryUsage().heapUsed - memoryBefore;
  console.log(`${count} gastos: ${elapsed.toFixed(2)} ms; variação heap ${(memory / 1024 / 1024).toFixed(2)} MB`);
}
