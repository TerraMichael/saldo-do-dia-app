import assert from 'node:assert/strict';
import test from 'node:test';
import { performance } from 'node:perf_hooks';

import { calcularPlanoDiario, type EntradaCalculoDiario } from '../src/features/daily-limit';
import { criarApresentacaoHistorico } from '../src/features/history';
import { desserializarPlanejamento, serializarPlanejamento } from '../src/storage/serialization';

function createConfiguration(count: number): EntradaCalculoDiario {
  return {
    saldoAtual: 10_000_000,
    reserva: 100_000,
    contasPendentes: 200_000,
    dataAtual: '2026-01-01',
    dataProximoRecebimento: '2026-02-01',
    gastosRegistrados: Array.from({ length: count }, (_, index) => ({
      id: `expense-${index}`,
      valor: (index % 100) + 1,
      data: index % 2 ? '2026-01-01' : '2025-12-31',
      descricao: `Gasto ${index}`,
    })),
  };
}

test('cálculo, histórico e persistência suportam 1.000 e 10.000 gastos', () => {
  const observations: Array<{ count: number; elapsed: number }> = [];
  for (const count of [1_000, 10_000]) {
    const configuration = createConfiguration(count);
    const started = performance.now();
    const result = calcularPlanoDiario(configuration);
    const presentation = criarApresentacaoHistorico(
      configuration.gastosRegistrados,
      configuration.dataAtual,
    );
    const document = serializarPlanejamento({
      cicloAtual: { id: 'current', inicio: null, configuracao: configuration },
      ciclosEncerrados: [],
    });
    const restored = desserializarPlanejamento(document);
    observations.push({ count, elapsed: performance.now() - started });
    assert.equal(result.totalGastosRegistrados > 0, true);
    assert.equal(presentation.quantidadeRegistros, count);
    assert.equal(
      restored.cicloAtual.configuracao.gastosRegistrados.length,
      count,
    );
  }
  assert.equal(observations.length, 2);
  assert.ok(observations.every(({ elapsed }) => Number.isFinite(elapsed)));
});

test('serialização suporta 100 ciclos encerrados sem compartilhar referências', () => {
  const configuration = createConfiguration(100);
  const cycles = Array.from({ length: 100 }, (_, index) => ({
    id: `cycle-${index}`,
    inicio: null,
    dataEncerramento: '2026-01-01',
    configuracaoFinal: structuredClone(configuration),
  }));
  const restored = desserializarPlanejamento(
    serializarPlanejamento({
      cicloAtual: { id: 'current', inicio: null, configuracao: configuration },
      ciclosEncerrados: cycles,
    }),
  );
  assert.equal(restored.ciclosEncerrados.length, 100);
  assert.notEqual(
    restored.ciclosEncerrados[0].configuracaoFinal,
    restored.ciclosEncerrados[1].configuracaoFinal,
  );
});
