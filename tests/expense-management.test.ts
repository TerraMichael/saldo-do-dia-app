import assert from 'node:assert/strict';
import test from 'node:test';

import type { EntradaCalculoDiario } from '../src/features/daily-limit';
import {
  editarGasto,
  ErroEdicaoGasto,
} from '../src/features/expenses/edit-expense';
import {
  excluirGasto,
  ErroExclusaoGasto,
} from '../src/features/expenses/delete-expense';
import {
  ErroRegistroGasto,
  registrarGasto,
} from '../src/features/expenses/register-expense';
import { criarApresentacaoHistorico } from '../src/features/history/presenter';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { criarArmazenamentoPlanejamento } from '../src/storage/planning-storage';
import {
  editarGastoPersistido,
  excluirGastoPersistido,
} from '../src/storage/planning-service';

const hoje = '2026-07-19';
const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 270_00,
  reserva: 0,
  contasPendentes: 115_00,
  dataAtual: hoje,
  dataProximoRecebimento: '2026-07-27',
  gastosRegistrados: [
    { id: 'gasto-a', valor: 10_00, data: hoje },
    { id: 'gasto-b', valor: 20_00, data: hoje },
  ],
};

test('novo gasto recebe o ID fornecido pelo gerador injetável', () => {
  let chamadas = 0;
  const registro = registrarGasto(
    { ...configuracaoBase, gastosRegistrados: [] },
    '10,00',
    hoje,
    () => {
      chamadas += 1;
      return 'uuid-deterministico';
    },
  );

  assert.equal(chamadas, 1);
  assert.equal(registro.configuracao.gastosRegistrados[0].id, 'uuid-deterministico');
});

test('dois gastos iguais recebem IDs diferentes', () => {
  let sequencia = 0;
  const gerarId = () => `uuid-${++sequencia}`;
  const vazio = { ...configuracaoBase, gastosRegistrados: [] };
  const primeiro = registrarGasto(vazio, '10,00', hoje, gerarId);
  const segundo = registrarGasto(primeiro.configuracao, '10,00', hoje, gerarId);

  assert.deepEqual(
    segundo.configuracao.gastosRegistrados.map((gasto) => gasto.id),
    ['uuid-1', 'uuid-2'],
  );
});

test('exclusão remove somente o ID escolhido e devolve seu valor ao saldo', () => {
  const exclusao = excluirGasto(configuracaoBase, 'gasto-a', hoje);

  assert.equal(exclusao.configuracao.saldoAtual, 280_00);
  assert.deepEqual(
    exclusao.configuracao.gastosRegistrados.map((gasto) => gasto.id),
    ['gasto-b'],
  );
  assert.equal(exclusao.resultado.totalGastosHoje, 20_00);
});

test('exclusão recalcula o planejamento e gasto de hoje', () => {
  const exclusao = excluirGasto(configuracaoBase, 'gasto-b', hoje);
  assert.equal(exclusao.resultado.totalGastosHoje, 10_00);
  assert.equal(exclusao.resultado.totalGastosRegistrados, 10_00);
  assert.equal(
    exclusao.resultado.valorDisponivel,
    exclusao.configuracao.saldoAtual - exclusao.configuracao.contasPendentes,
  );
});

test('exclusão de gasto antigo não remove outro registro', () => {
  const configuracao: EntradaCalculoDiario = {
    ...configuracaoBase,
    gastosRegistrados: [
      { id: 'antigo', valor: 5_00, data: '2026-07-18' },
      ...configuracaoBase.gastosRegistrados,
    ],
  };
  const exclusao = excluirGasto(configuracao, 'antigo', hoje);
  assert.deepEqual(
    exclusao.configuracao.gastosRegistrados.map((gasto) => gasto.id),
    ['gasto-a', 'gasto-b'],
  );
});

test('edição preserva ID e data e valor menor aumenta o saldo', () => {
  const edicao = editarGasto(configuracaoBase, 'gasto-b', '15,00', hoje);
  const gasto = edicao.configuracao.gastosRegistrados[1];

  assert.deepEqual(gasto, { id: 'gasto-b', valor: 15_00, data: hoje });
  assert.equal(edicao.configuracao.saldoAtual, 275_00);
  assert.equal(edicao.alterado, true);
});

test('edição para valor maior reduz o saldo e recalcula limites', () => {
  const edicao = editarGasto(configuracaoBase, 'gasto-a', '40,00', hoje);

  assert.equal(edicao.configuracao.saldoAtual, 240_00);
  assert.equal(edicao.resultado.totalGastosHoje, 60_00);
  assert.ok(edicao.resultado.excedenteHoje > 0);
  assert.ok(edicao.resultado.limiteDiasFuturos !== null);
});

test('editar gasto de R$ 10,00 para R$ 20,00 desconta somente a diferença do limite de R$ 30,00', () => {
  const configuracao: EntradaCalculoDiario = {
    saldoAtual: 240_00,
    reserva: 0,
    contasPendentes: 0,
    dataAtual: hoje,
    dataProximoRecebimento: '2026-07-27',
    gastosRegistrados: [],
  };
  const registrado = registrarGasto(
    configuracao,
    '10,00',
    hoje,
    () => 'regressao-edicao',
  );

  assert.equal(registrado.resultado.limitePlanejadoHoje, 30_00);
  assert.equal(registrado.resultado.restanteHoje, 20_00);

  const editado = editarGasto(
    registrado.configuracao,
    'regressao-edicao',
    '20,00',
    hoje,
  );

  assert.equal(editado.configuracao.saldoAtual, 220_00);
  assert.equal(editado.resultado.limitePlanejadoHoje, 30_00);
  assert.equal(editado.resultado.totalGastosHoje, 20_00);
  assert.equal(editado.resultado.restanteHoje, 10_00);
  assert.equal(editado.resultado.excedenteHoje, 0);
  assert.equal(editado.resultado.limiteDiasFuturos, 30_00);
});

test('valor idêntico é tratado como operação sem mudança', () => {
  const edicao = editarGasto(configuracaoBase, 'gasto-a', '10,00', hoje);
  assert.equal(edicao.alterado, false);
  assert.equal(edicao.configuracao, configuracaoBase);
});

test('gasto inexistente é rejeitado sem modificar a configuração', () => {
  const antes = JSON.stringify(configuracaoBase);
  assert.throws(
    () => editarGasto(configuracaoBase, 'inexistente', '10,00', hoje),
    (erro) =>
      erro instanceof ErroEdicaoGasto &&
      erro.codigo === 'GASTO_NAO_ENCONTRADO',
  );
  assert.throws(
    () => excluirGasto(configuracaoBase, 'inexistente', hoje),
    (erro) =>
      erro instanceof ErroExclusaoGasto &&
      erro.codigo === 'GASTO_NAO_ENCONTRADO',
  );
  assert.equal(JSON.stringify(configuracaoBase), antes);
});

test('edição rejeita valor vazio, zero, negativo e inválido', () => {
  for (const valor of ['', '0,00', '-1,00', 'texto']) {
    assert.throws(
      () => editarGasto(configuracaoBase, 'gasto-a', valor, hoje),
      (erro) => erro instanceof ErroRegistroGasto,
    );
  }
});

test('falha de persistência mantém configuração anterior na edição e exclusão', async () => {
  const adaptador = new AdaptadorMemoria();
  const armazenamento = criarArmazenamentoPlanejamento(adaptador);
  await armazenamento.salvar(configuracaoBase);
  adaptador.falharGravacao = true;

  await assert.rejects(() =>
    editarGastoPersistido(
      armazenamento,
      configuracaoBase,
      'gasto-a',
      '50,00',
      hoje,
    ),
  );
  await assert.rejects(() =>
    excluirGastoPersistido(armazenamento, configuracaoBase, 'gasto-a', hoje),
  );
  adaptador.falharGravacao = false;
  assert.deepEqual(await armazenamento.carregar(), configuracaoBase);
});

test('histórico atualiza os totais após edição e exclusão', () => {
  const editado = editarGasto(configuracaoBase, 'gasto-a', '15,00', hoje);
  const aposEdicao = criarApresentacaoHistorico(
    editado.configuracao.gastosRegistrados,
    hoje,
  );
  assert.equal(aposEdicao.totalCiclo, 'R$ 35,00');

  const excluido = excluirGasto(editado.configuracao, 'gasto-b', hoje);
  const aposExclusao = criarApresentacaoHistorico(
    excluido.configuracao.gastosRegistrados,
    hoje,
  );
  assert.equal(aposExclusao.totalCiclo, 'R$ 15,00');
  assert.equal(aposExclusao.quantidadeRegistros, 1);
});

test('dois gastos iguais podem ser editados e excluídos separadamente', () => {
  const iguais: EntradaCalculoDiario = {
    ...configuracaoBase,
    gastosRegistrados: [
      { id: 'igual-1', valor: 10_00, data: hoje },
      { id: 'igual-2', valor: 10_00, data: hoje },
    ],
  };
  const editado = editarGasto(iguais, 'igual-1', '20,00', hoje);
  assert.deepEqual(
    editado.configuracao.gastosRegistrados.map((gasto) => gasto.valor),
    [20_00, 10_00],
  );
  const excluido = excluirGasto(editado.configuracao, 'igual-2', hoje);
  assert.deepEqual(
    excluido.configuracao.gastosRegistrados.map((gasto) => gasto.id),
    ['igual-1'],
  );
});
