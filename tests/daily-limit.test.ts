import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calcularLimiteDiario,
  calcularPlanoDiario,
  calcularQuantidadeDeDiasRestantes,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
} from '../src/features/daily-limit/index';

const entradaBase: EntradaCalculoDiario = {
  saldoAtual: 100_00,
  reserva: 0,
  contasPendentes: 20_00,
  dataAtual: '2026-07-01',
  dataProximoRecebimento: '2026-07-05',
  gastosRegistrados: [10_00, 5_50],
};

test('calcula o cenário normal e informa os gastos do ciclo sem descontá-los novamente', () => {
  assert.deepEqual(calcularPlanoDiario(entradaBase), {
    valorDisponivel: 80_00,
    limiteDiario: 20_00,
    quantidadeDeDiasRestantes: 4,
    totalGastosRegistrados: 15_50,
  });
});

test('representa saldo insuficiente com limite negativo', () => {
  const resultado = calcularPlanoDiario({ ...entradaBase, saldoAtual: 15_00 });
  assert.equal(resultado.valorDisponivel, -5_00);
  assert.equal(resultado.limiteDiario, -1_25);
});

test('suporta saldo atual negativo', () => {
  const resultado = calcularPlanoDiario({ ...entradaBase, saldoAtual: -10_00, contasPendentes: 0 });
  assert.equal(resultado.limiteDiario, -2_50);
});

test('subtrai contas maiores que o saldo', () => {
  const resultado = calcularPlanoDiario({ ...entradaBase, saldoAtual: 50_00, contasPendentes: 70_00 });
  assert.equal(resultado.valorDisponivel, -20_00);
});

test('protege o valor reservado pelo usuário', () => {
  const resultado = calcularPlanoDiario({ ...entradaBase, reserva: 30_00 });
  assert.equal(resultado.valorDisponivel, 50_00);
  assert.equal(resultado.limiteDiario, 12_50);
});

test('usa um dia quando o recebimento ocorre na data atual', () => {
  const resultado = calcularPlanoDiario({
    ...entradaBase,
    dataProximoRecebimento: entradaBase.dataAtual,
  });
  assert.equal(resultado.quantidadeDeDiasRestantes, 1);
  assert.equal(resultado.limiteDiario, 80_00);
  assert.ok(Number.isFinite(resultado.limiteDiario));
});

test('calcula um único dia restante', () => {
  const resultado = calcularPlanoDiario({ ...entradaBase, dataProximoRecebimento: '2026-07-02' });
  assert.equal(resultado.quantidadeDeDiasRestantes, 1);
  assert.equal(resultado.limiteDiario, 80_00);
});

test('rejeita datas inválidas com erro de domínio claro', () => {
  assert.throws(
    () => calcularQuantidadeDeDiasRestantes('2026-02-30', '2026-03-10'),
    (erro) => erro instanceof ErroCalculoFinanceiro && erro.codigo === 'DATA_INVALIDA',
  );
  assert.throws(
    () => calcularQuantidadeDeDiasRestantes('2026-07-02', '2026-07-01'),
    (erro) => erro instanceof ErroCalculoFinanceiro && erro.codigo === 'ORDEM_DE_DATAS_INVALIDA',
  );
});

test('mantém precisão de centavos e arredonda o limite para baixo', () => {
  const resultado = calcularPlanoDiario({
    ...entradaBase,
    saldoAtual: 10_01,
    contasPendentes: 0,
    dataProximoRecebimento: '2026-07-04',
  });
  assert.equal(resultado.valorDisponivel, 10_01);
  assert.equal(resultado.limiteDiario, 3_33);
});

test('não produz NaN ou Infinity quando a quantidade de dias é inválida', () => {
  assert.throws(
    () => calcularLimiteDiario(10_00, 0),
    (erro) => erro instanceof ErroCalculoFinanceiro && erro.codigo === 'DATA_INVALIDA',
  );
});
