import assert from 'node:assert/strict';
import test from 'node:test';

import type { DadosPlanejamento } from '../src/features/cycle-history';
import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
} from '../src/features/daily-limit';
import {
  editarGasto,
  excluirGasto,
  registrarGasto,
} from '../src/features/expenses';
import {
  editarGastoPersistido,
  iniciarNovoCicloPersistido,
  registrarGastoPersistido,
} from '../src/storage/planning-service';
import {
  CoordenadorMutacoes,
  ErroOperacaoEmAndamento,
} from '../src/storage/mutation-coordinator';
import { AgendadorAtualizacaoData } from '../src/features/onboarding/date-refresh-scheduler';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { criarArmazenamentoPlanejamento } from '../src/storage/planning-storage';
import { desserializarPlanejamento, serializarPlanejamento } from '../src/storage/serialization';

const today = '2026-07-01';
const initial: EntradaCalculoDiario = {
  saldoAtual: 100_00,
  reserva: 0,
  contasPendentes: 0,
  dataAtual: today,
  dataProximoRecebimento: '2026-07-10',
  gastosRegistrados: [],
};

test('sequência completa e inversos restauram o saldo inicial', () => {
  const first = registrarGasto(initial, { valor: '10,00' }, today, () => 'a');
  const second = registrarGasto(first.configuracao, { valor: '20,00' }, today, () => 'b');
  const larger = editarGasto(second.configuracao, 'a', { valor: '30,00' }, today);
  const smaller = editarGasto(larger.configuracao, 'a', { valor: '5,00' }, today);
  const described = editarGasto(
    smaller.configuracao,
    'a',
    { valor: '5,00', descricao: '  Mercado  ' },
    today,
  );
  assert.equal(described.configuracao.saldoAtual, smaller.configuracao.saldoAtual);
  const withoutSecond = excluirGasto(described.configuracao, 'b', today);
  const empty = excluirGasto(withoutSecond.configuracao, 'a', today);
  assert.equal(empty.configuracao.saldoAtual, initial.saldoAtual);
  assert.deepEqual(empty.configuracao.gastosRegistrados, []);
  assert.equal(empty.resultado.totalGastosRegistrados, 0);
});

test('mudança de dia separa total de ciclo e total de hoje', () => {
  const first = registrarGasto(initial, { valor: '10,00' }, today, () => 'a');
  const next = registrarGasto(
    first.configuracao,
    { valor: '20,00' },
    '2026-07-02',
    () => 'b',
  );
  assert.equal(next.resultado.totalGastosRegistrados, 30_00);
  assert.equal(next.resultado.totalGastosHoje, 20_00);
});

test('novo ciclo arquiva, serializa e restaura todos os valores', async () => {
  const current = registrarGasto(initial, { valor: '10,00' }, today, () => 'a');
  const data: DadosPlanejamento = {
    cicloAtual: {
      id: 'current',
      inicio: null,
      configuracao: current.configuracao,
    },
    ciclosEncerrados: [],
  };
  const storage = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const next = await iniciarNovoCicloPersistido(
    storage,
    data,
    {
      saldoAtual: '200,00',
      contasPendentes: '50,00',
      reserva: '10,00',
      dataProximoRecebimento: '2026-08-01',
    },
    '2026-07-10',
    () => 'next',
  );
  const restored = desserializarPlanejamento(
    serializarPlanejamento(next.dados),
  );
  assert.equal(restored.ciclosEncerrados.length, 1);
  assert.deepEqual(
    restored.ciclosEncerrados[0].configuracaoFinal.gastosRegistrados,
    current.configuracao.gastosRegistrados,
  );
  assert.deepEqual(restored.cicloAtual.configuracao.gastosRegistrados, []);
});

test('falha seguida de repetição bem-sucedida registra uma única vez', async () => {
  const adapter = new AdaptadorMemoria();
  const storage = criarArmazenamentoPlanejamento(adapter);
  const data: DadosPlanejamento = {
    cicloAtual: { id: 'current', inicio: null, configuracao: initial },
    ciclosEncerrados: [],
  };
  await storage.salvar(data);
  adapter.falharGravacao = true;
  await assert.rejects(() =>
    registrarGastoPersistido(
      storage,
      data,
      { valor: '10,00' },
      today,
      () => 'only',
    ),
  );
  adapter.falharGravacao = false;
  assert.deepEqual((await storage.carregar())?.cicloAtual.configuracao, initial);
  const saved = await registrarGastoPersistido(
    storage,
    data,
    { valor: '10,00' },
    today,
    () => 'only',
  );
  assert.equal(saved.configuracao.gastosRegistrados.length, 1);
  assert.equal(
    (await storage.carregar())?.cicloAtual.configuracao.gastosRegistrados.length,
    1,
  );
});

test('edição sem mudança não grava e preserva referência', async () => {
  const registered = registrarGasto(initial, { valor: '10,00' }, today, () => 'a');
  const data: DadosPlanejamento = {
    cicloAtual: { id: 'current', inicio: null, configuracao: registered.configuracao },
    ciclosEncerrados: [],
  };
  let calls = 0;
  const storage = {
    carregar: async () => data,
    salvar: async () => {
      calls += 1;
    },
    remover: async () => undefined,
  };
  const result = await editarGastoPersistido(
    storage,
    data,
    'a',
    { valor: '10,00' },
    today,
  );
  assert.equal(result.alterado, false);
  assert.equal(result.dados, data);
  assert.equal(calls, 0);
});

test('coordenador rejeita toque concorrente e libera após sucesso ou falha', async () => {
  const coordinator = new CoordenadorMutacoes();
  let release!: () => void;
  const pending = coordinator.executar(
    () => new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  assert.equal(coordinator.ocupado, true);
  await assert.rejects(
    () => coordinator.executar(async () => undefined),
    (error) => error instanceof ErroOperacaoEmAndamento,
  );
  release();
  await pending;
  assert.equal(coordinator.ocupado, false);
  await assert.rejects(() =>
    coordinator.executar(async () => {
      throw new Error('falha');
    }),
  );
  assert.equal(coordinator.ocupado, false);
});

test('atualização de data aguarda mutação, usa estado confirmado e coalesce eventos', async () => {
  const coordinator = new CoordenadorMutacoes();
  let liberarMutacao!: () => void;
  let estadoConfirmado = initial;
  let atualizacoes = 0;
  let gravacoes = 0;
  let publicadoDepoisDeSalvar = false;
  const proximaData = '2026-07-02';

  const mutacao = coordinator.executar(async () => {
    await new Promise<void>((resolve) => {
      liberarMutacao = resolve;
    });
    estadoConfirmado = registrarGasto(
      estadoConfirmado,
      { valor: '10,00' },
      today,
      () => 'gasto-confirmado',
    ).configuracao;
  });

  const scheduler = new AgendadorAtualizacaoData(
    coordinator,
    async (podePublicar) => {
      atualizacoes += 1;
      const configuracaoAtualizada = {
        ...estadoConfirmado,
        dataAtual: proximaData,
      };
      gravacoes += 1;
      await Promise.resolve();
      if (podePublicar()) {
        publicadoDepoisDeSalvar = gravacoes === 1;
        estadoConfirmado = configuracaoAtualizada;
      }
    },
  );

  const primeiraSolicitacao = scheduler.solicitar();
  const segundaSolicitacao = scheduler.solicitar();
  const terceiraSolicitacao = scheduler.solicitar();
  assert.equal(primeiraSolicitacao, segundaSolicitacao);
  assert.equal(segundaSolicitacao, terceiraSolicitacao);
  assert.equal(atualizacoes, 0);
  assert.equal(coordinator.ocupado, true);

  liberarMutacao();
  await mutacao;
  await primeiraSolicitacao;

  assert.equal(atualizacoes, 1);
  assert.equal(gravacoes, 1);
  assert.equal(publicadoDepoisDeSalvar, true);
  assert.equal(estadoConfirmado.dataAtual, proximaData);
  assert.equal(estadoConfirmado.gastosRegistrados.length, 1);
  assert.equal(estadoConfirmado.gastosRegistrados[0].id, 'gasto-confirmado');
  const resultado = calcularPlanoDiario(estadoConfirmado);
  assert.equal(resultado.totalGastosRegistrados, 10_00);
  assert.equal(resultado.totalGastosHoje, 0);
  assert.equal(resultado.limitePlanejadoHoje, 11_25);
});

test('atualização para a mesma data não grava e falha permite nova tentativa', async () => {
  const coordinator = new CoordenadorMutacoes();
  let tentativas = 0;
  let gravacoes = 0;
  let dataAtual = today;
  const scheduler = new AgendadorAtualizacaoData(
    coordinator,
    async () => {
      tentativas += 1;
      if (dataAtual === today) return;
      if (tentativas === 2) throw new Error('falha simulada');
      gravacoes += 1;
    },
  );

  await scheduler.solicitar();
  assert.equal(gravacoes, 0);

  dataAtual = '2026-07-02';
  await scheduler.solicitar();
  assert.equal(coordinator.ocupado, false);
  assert.equal(gravacoes, 0);

  await scheduler.solicitar();
  assert.equal(gravacoes, 1);
  assert.equal(coordinator.ocupado, false);
});

test('desmontagem durante atualização impede publicação tardia', async () => {
  const coordinator = new CoordenadorMutacoes();
  let liberarAtualizacao!: () => void;
  let publicacoes = 0;
  const scheduler = new AgendadorAtualizacaoData(
    coordinator,
    async (podePublicar) => {
      await new Promise<void>((resolve) => {
        liberarAtualizacao = resolve;
      });
      if (podePublicar()) publicacoes += 1;
    },
  );

  const atualizacao = scheduler.solicitar();
  await Promise.resolve();
  scheduler.desmontar();
  liberarAtualizacao();
  await atualizacao;

  assert.equal(publicacoes, 0);
  assert.equal(coordinator.ocupado, false);
});
