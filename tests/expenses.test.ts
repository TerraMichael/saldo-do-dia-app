import assert from 'node:assert/strict';
import test from 'node:test';

import type { EntradaCalculoDiario } from '../src/features/daily-limit/index';
import {
  converterValorGastoParaCentavos,
  ErroRegistroGasto,
  registrarGasto,
} from '../src/features/expenses/register-expense';
import { criarApresentacaoHome } from '../src/features/home/presenter';

const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 100_000,
  reserva: 10_000,
  contasPendentes: 20_000,
  dataAtual: '2026-07-18',
  dataProximoRecebimento: '2026-07-25',
  gastosRegistrados: [],
};

function registrar(
  configuracao: EntradaCalculoDiario,
  valor: string,
  data: string,
) {
  return registrarGasto(
    configuracao,
    valor,
    data,
    () => `gasto-${configuracao.gastosRegistrados.length + 1}`,
  );
}

test('gasto válido reduz o saldo atual', () => {
  const registro = registrar(configuracaoBase, 'R$ 125,50', '2026-07-19');
  assert.equal(registro.configuracao.saldoAtual, 87_450);
});

test('gasto válido é adicionado ao final de gastosRegistrados', () => {
  const configuracao = {
    ...configuracaoBase,
    gastosRegistrados: [{ id: 'gasto-1', valor: 5_00, data: '2026-07-18' }],
  };
  const registro = registrar(configuracao, '10,00', '2026-07-19');
  assert.deepEqual(registro.configuracao.gastosRegistrados, [
    { id: 'gasto-1', valor: 5_00, data: '2026-07-18' },
    { id: 'gasto-2', valor: 10_00, data: '2026-07-19' },
  ]);
});

test('resultado financeiro é recalculado', () => {
  const registro = registrar(configuracaoBase, 'R$ 70,00', '2026-07-19');
  assert.equal(registro.resultado.valorDisponivel, 63_000);
  assert.equal(registro.resultado.restanteHoje, 4_666);
});

test('múltiplos gastos são acumulados corretamente', () => {
  const primeiro = registrar(configuracaoBase, '10,00', '2026-07-19');
  const segundo = registrar(primeiro.configuracao, '20,00', '2026-07-19');

  assert.equal(segundo.configuracao.saldoAtual, 97_000);
  assert.deepEqual(segundo.configuracao.gastosRegistrados, [
    { id: 'gasto-1', valor: 10_00, data: '2026-07-19' },
    { id: 'gasto-2', valor: 20_00, data: '2026-07-19' },
  ]);
});

test('totalGastosRegistrados é atualizado', () => {
  const primeiro = registrar(configuracaoBase, '10,00', '2026-07-19');
  const segundo = registrar(primeiro.configuracao, '20,00', '2026-07-19');
  assert.equal(segundo.resultado.totalGastosRegistrados, 30_00);
});

test('gasto maior que o saldo atual é permitido', () => {
  const registro = registrar(configuracaoBase, 'R$ 1.200,00', '2026-07-19');
  assert.equal(registro.configuracao.saldoAtual, -20_000);
});

test('gasto maior que o saldo pode gerar déficit', () => {
  const registro = registrar(configuracaoBase, 'R$ 1.200,00', '2026-07-19');
  assert.equal(registro.resultado.valorDisponivel, -50_000);
  assert.equal(registro.resultado.restanteHoje, 0);
  assert.ok(registro.resultado.excedenteHoje > 0);
  assert.ok((registro.resultado.limiteDiasFuturos ?? 0) < 0);
});

test('gasto vazio é rejeitado', () => {
  assert.throws(
    () => registrar(configuracaoBase, ' ', '2026-07-19'),
    (erro) =>
      erro instanceof ErroRegistroGasto && erro.codigo === 'VALOR_OBRIGATORIO',
  );
});

test('gasto zero é rejeitado', () => {
  assert.throws(
    () => registrar(configuracaoBase, '0,00', '2026-07-19'),
    (erro) =>
      erro instanceof ErroRegistroGasto && erro.codigo === 'VALOR_NAO_POSITIVO',
  );
});

test('gasto negativo é rejeitado', () => {
  assert.throws(
    () => registrar(configuracaoBase, '-10,00', '2026-07-19'),
    (erro) =>
      erro instanceof ErroRegistroGasto && erro.codigo === 'VALOR_NAO_POSITIVO',
  );
});

test('valor inválido é rejeitado', () => {
  assert.throws(
    () => registrar(configuracaoBase, '12,3x', '2026-07-19'),
    (erro) => erro instanceof ErroRegistroGasto && erro.codigo === 'VALOR_INVALIDO',
  );
});

test('números fora do intervalo seguro são rejeitados', () => {
  assert.throws(
    () => converterValorGastoParaCentavos('90.071.992.547.409,92'),
    (erro) =>
      erro instanceof ErroRegistroGasto && erro.codigo === 'VALOR_FORA_INTERVALO',
  );
});

test('dataAtual é atualizada no registro', () => {
  const registro = registrar(configuracaoBase, '10,00', '2026-07-20');
  assert.equal(registro.configuracao.dataAtual, '2026-07-20');
});

test('gastos não são descontados duas vezes', () => {
  const configuracao = {
    ...configuracaoBase,
    saldoAtual: 10_000,
    reserva: 0,
    contasPendentes: 0,
  };
  const registro = registrar(configuracao, '10,00', '2026-07-19');

  assert.equal(registro.configuracao.saldoAtual, 9_000);
  assert.equal(registro.resultado.valorDisponivel, 9_000);
  assert.equal(registro.resultado.totalGastosRegistrados, 10_00);
});

test('planejamento vencido orienta o usuário a editar', () => {
  assert.throws(
    () => registrar(configuracaoBase, '10,00', '2026-07-26'),
    (erro) =>
      erro instanceof ErroRegistroGasto &&
      erro.codigo === 'PLANEJAMENTO_VENCIDO' &&
      /Edite o planejamento/.test(erro.message),
  );
});

test('presenter da Home mostra o total gasto', () => {
  const registro = registrar(configuracaoBase, 'R$ 125,50', '2026-07-19');
  const apresentacao = criarApresentacaoHome(
    registro.configuracao,
    registro.resultado,
  );
  assert.equal(apresentacao.totalGastosRegistrados, 'R$ 125,50');
});

test('configuração e resultado retornam sincronizados', () => {
  const registro = registrar(configuracaoBase, 'R$ 70,00', '2026-07-19');

  assert.equal(
    registro.resultado.valorDisponivel,
    registro.configuracao.saldoAtual -
      registro.configuracao.reserva -
      registro.configuracao.contasPendentes,
  );
  assert.equal(
    registro.resultado.totalGastosRegistrados,
    registro.configuracao.gastosRegistrados.reduce(
      (total, gasto) => total + gasto.valor,
      0,
    ),
  );
});
