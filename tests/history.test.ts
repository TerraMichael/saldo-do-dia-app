import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type GastoRegistrado,
} from '../src/features/daily-limit';
import {
  agruparGastosPorData,
  criarApresentacaoHistorico,
} from '../src/features/history/presenter';
import { hidratarPlanejamento } from '../src/storage/hydration';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { criarArmazenamentoPlanejamento } from '../src/storage/planning-storage';

const hoje = '2026-07-19';
const gastos: readonly GastoRegistrado[] = [
  { id: 'gasto-1', valor: 10_00, data: '2026-07-17' },
  { id: 'gasto-2', valor: 5_50, data: '2026-07-19' },
  { id: 'gasto-3', valor: 20_25, data: '2026-07-18' },
  { id: 'gasto-4', valor: 4_50, data: '2026-07-19' },
];

const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 100_000,
  reserva: 10_000,
  contasPendentes: 20_000,
  dataAtual: hoje,
  dataProximoRecebimento: '2026-07-25',
  gastosRegistrados: gastos,
};
const dadosBase = {
  cicloAtual: { id: 'ciclo-atual', inicio: null, configuracao: configuracaoBase },
  ciclosEncerrados: [],
};

test('histórico vazio produz resumo zerado e nenhum grupo', () => {
  const apresentacao = criarApresentacaoHistorico([], hoje);

  assert.equal(apresentacao.vazio, true);
  assert.equal(apresentacao.totalCiclo, 'R$ 0,00');
  assert.equal(apresentacao.totalHoje, 'R$ 0,00');
  assert.equal(apresentacao.quantidadeRegistros, 0);
  assert.deepEqual(apresentacao.grupos, []);
});

test('um gasto cria um grupo e um item', () => {
  const apresentacao = criarApresentacaoHistorico(
    [{ id: 'gasto-1', valor: 12_34, data: hoje }],
    hoje,
  );

  assert.equal(apresentacao.grupos.length, 1);
  assert.equal(apresentacao.grupos[0].itens.length, 1);
  assert.equal(apresentacao.grupos[0].itens[0].valor, 'R$ 12,34');
});

test('múltiplos gastos do mesmo dia ficam no mesmo grupo e preservam o mais recente primeiro', () => {
  const grupos = agruparGastosPorData([
    { id: 'gasto-1', valor: 10_00, data: hoje },
    { id: 'gasto-2', valor: 20_00, data: hoje },
    { id: 'gasto-3', valor: 30_00, data: hoje },
  ]);

  assert.equal(grupos.length, 1);
  assert.deepEqual(
    grupos[0].gastos.map((gasto) => gasto.valor),
    [30_00, 20_00, 10_00],
  );
});

test('gastos de dias diferentes criam grupos separados', () => {
  const grupos = agruparGastosPorData(gastos);
  assert.equal(grupos.length, 3);
});

test('grupos são ordenados da data mais recente para a mais antiga', () => {
  const grupos = agruparGastosPorData(gastos);
  assert.deepEqual(
    grupos.map((grupo) => grupo.dataCivil),
    ['2026-07-19', '2026-07-18', '2026-07-17'],
  );
});

test('calcula o total correto de cada data', () => {
  const grupos = agruparGastosPorData(gastos);
  assert.equal(grupos[0].total, 10_00);
  assert.equal(grupos[1].total, 20_25);
  assert.equal(grupos[2].total, 10_00);
});

test('calcula o total correto do ciclo', () => {
  const apresentacao = criarApresentacaoHistorico(gastos, hoje);
  assert.equal(apresentacao.totalCiclo, 'R$ 40,25');
});

test('calcula o total gasto hoje pela data civil', () => {
  const apresentacao = criarApresentacaoHistorico(gastos, hoje);
  assert.equal(apresentacao.totalHoje, 'R$ 10,00');
});

test('calcula a quantidade total de registros', () => {
  const apresentacao = criarApresentacaoHistorico(gastos, hoje);
  assert.equal(apresentacao.quantidadeRegistros, 4);
  assert.equal(apresentacao.quantidadeRegistrosTexto, '4 registros');
});

test('formata valores do histórico em moeda brasileira', () => {
  const apresentacao = criarApresentacaoHistorico(
    [{ id: 'gasto-1', valor: 123_456, data: hoje }],
    hoje,
  );
  assert.equal(apresentacao.totalCiclo, 'R$ 1.234,56');
  assert.equal(apresentacao.grupos[0].itens[0].valor, 'R$ 1.234,56');
});

test('formata a data civil no padrão brasileiro', () => {
  const apresentacao = criarApresentacaoHistorico(
    [{ id: 'gasto-1', valor: 10_00, data: '2026-12-31' }],
    hoje,
  );
  assert.equal(apresentacao.grupos[0].data, '31/12/2026');
});

test('preserva valores com centavos em itens e totais', () => {
  const apresentacao = criarApresentacaoHistorico(
    [
      { id: 'gasto-1', valor: 10_01, data: hoje },
      { id: 'gasto-2', valor: 20_02, data: hoje },
    ],
    hoje,
  );
  assert.equal(apresentacao.grupos[0].total, 'R$ 30,03');
  assert.deepEqual(
    apresentacao.grupos[0].itens.map((item) => item.valor),
    ['R$ 20,02', 'R$ 10,01'],
  );
});

test('gastos permanecem disponíveis após salvar e hidratar novamente', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  await armazenamento.salvar(dadosBase);
  const restaurado = await hidratarPlanejamento(armazenamento, hoje);

  assert.equal(restaurado.tipo, 'pronto');
  if (restaurado.tipo === 'pronto') {
    assert.deepEqual(restaurado.configuracao.gastosRegistrados, gastos);
    assert.equal(
      criarApresentacaoHistorico(
        restaurado.configuracao.gastosRegistrados,
        restaurado.configuracao.dataAtual,
      ).quantidadeRegistros,
      4,
    );
  }
});

test('abrir o histórico não altera saldo, configuração ou resultado financeiro', () => {
  const resultado = calcularPlanoDiario(configuracaoBase);
  const configuracaoAntes = JSON.stringify(configuracaoBase);
  const resultadoAntes = JSON.stringify(resultado);

  criarApresentacaoHistorico(
    configuracaoBase.gastosRegistrados,
    configuracaoBase.dataAtual,
  );

  assert.equal(JSON.stringify(configuracaoBase), configuracaoAntes);
  assert.equal(JSON.stringify(resultado), resultadoAntes);
});

test('estado vazio oferece ação para registrar gasto', () => {
  const tela = readFileSync(
    'src/features/history/components/HistoryScreen.tsx',
    'utf8',
  );
  assert.match(tela, /Nenhum gasto registrado/);
  assert.match(tela, /Registrar gasto/);
  assert.match(tela, /router\.push\('\/registrar-gasto'\)/);
});

test('presenter não modifica o array original nem seus objetos', () => {
  const original = gastos.map((gasto) => ({ ...gasto }));
  criarApresentacaoHistorico(gastos, hoje);
  assert.deepEqual(gastos, original);
});

test('datas inválidas não causam erro e aparecem depois das datas válidas', () => {
  const apresentacao = criarApresentacaoHistorico(
    [
      { id: 'gasto-1', valor: 10_00, data: 'data-inválida' },
      { id: 'gasto-2', valor: 20_00, data: hoje },
      { id: 'gasto-3', valor: 5_00, data: '2026-02-30' },
    ],
    hoje,
  );

  assert.equal(apresentacao.grupos[0].data, '19/07/2026');
  assert.deepEqual(
    apresentacao.grupos.slice(1).map((grupo) => grupo.data),
    ['Data inválida', 'Data inválida'],
  );
});

test('arquivo de histórico é executado explicitamente pelo npm test', () => {
  const pacote = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: { test: string };
  };
  assert.match(pacote.scripts.test, /tests\/history\.test\.ts/);
});
