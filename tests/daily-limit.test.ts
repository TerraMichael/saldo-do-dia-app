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
  gastosRegistrados: [
    { id: 'gasto-1', valor: 10_00, data: '2026-06-30' },
    { id: 'gasto-2', valor: 5_50, data: '2026-06-30' },
  ],
};

test('calcula o cenário normal e informa os gastos do ciclo sem descontá-los novamente', () => {
  assert.deepEqual(calcularPlanoDiario(entradaBase), {
    valorDisponivel: 80_00,
    limiteDiario: 20_00,
    quantidadeDeDiasRestantes: 4,
    totalGastosRegistrados: 15_50,
    totalGastosHoje: 0,
    limitePlanejadoHoje: 20_00,
    restanteHoje: 20_00,
    excedenteHoje: 0,
    quantidadeDeDiasFuturos: 3,
    limiteDiasFuturos: 20_00,
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

const cenarioSaldoDoDia: EntradaCalculoDiario = {
  saldoAtual: 300_00,
  reserva: 0,
  contasPendentes: 115_00,
  dataAtual: '2026-07-01',
  dataProximoRecebimento: '2026-07-09',
  gastosRegistrados: [],
};

test('sem gastos mantém R$ 23,12 como restante de hoje em oito dias', () => {
  const resultado = calcularPlanoDiario(cenarioSaldoDoDia);

  assert.equal(resultado.restanteHoje, 23_12);
  assert.equal(resultado.limitePlanejadoHoje, 23_12);
  assert.equal(resultado.quantidadeDeDiasFuturos, 7);
});

test('gasto de R$ 10,00 reduz somente o restante de hoje', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    saldoAtual: 290_00,
    gastosRegistrados: [{ id: 'gasto-1', valor: 10_00, data: '2026-07-01' }],
  });

  assert.equal(resultado.restanteHoje, 13_12);
  assert.equal(resultado.limiteDiasFuturos, 23_12);
});

test('gasto igual ao limite encerra o orçamento de hoje sem excedente', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    saldoAtual: 276_88,
    gastosRegistrados: [{ id: 'gasto-1', valor: 23_12, data: '2026-07-01' }],
  });

  assert.equal(resultado.restanteHoje, 0);
  assert.equal(resultado.excedenteHoje, 0);
});

test('gasto acima do limite gera excedente e redistribui somente os dias futuros', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    saldoAtual: 270_00,
    gastosRegistrados: [{ id: 'gasto-1', valor: 30_00, data: '2026-07-01' }],
  });

  assert.equal(resultado.restanteHoje, 0);
  assert.equal(resultado.excedenteHoje, 6_88);
  assert.equal(resultado.limiteDiasFuturos, 22_14);
  assert.equal(resultado.quantidadeDeDiasFuturos, 7);
});

test('múltiplos gastos na mesma data são somados como gasto de hoje', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    saldoAtual: 270_00,
    gastosRegistrados: [
      { id: 'gasto-1', valor: 10_00, data: '2026-07-01' },
      { id: 'gasto-2', valor: 20_00, data: '2026-07-01' },
    ],
  });

  assert.equal(resultado.totalGastosHoje, 30_00);
});

test('gastos anteriores permanecem no ciclo, mas não entram no gasto de hoje', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    gastosRegistrados: [{ id: 'gasto-1', valor: 30_00, data: '2026-06-30' }],
  });

  assert.equal(resultado.totalGastosHoje, 0);
  assert.equal(resultado.totalGastosRegistrados, 30_00);
});

test('mudança de dia recalcula o orçamento com saldo e quantidade de dias atuais', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    saldoAtual: 270_00,
    dataAtual: '2026-07-02',
    gastosRegistrados: [{ id: 'gasto-1', valor: 30_00, data: '2026-07-01' }],
  });

  assert.equal(resultado.totalGastosHoje, 0);
  assert.equal(resultado.quantidadeDeDiasRestantes, 7);
  assert.equal(resultado.restanteHoje, 22_14);
});

test('recebimento hoje não cria limite futuro e mantém o restante de hoje', () => {
  const resultado = calcularPlanoDiario({
    ...cenarioSaldoDoDia,
    dataProximoRecebimento: cenarioSaldoDoDia.dataAtual,
  });

  assert.equal(resultado.quantidadeDeDiasFuturos, 0);
  assert.equal(resultado.limiteDiasFuturos, null);
  assert.equal(resultado.restanteHoje, 185_00);
});

test('déficit sem gasto hoje não produz excedente', () => {
  const resultado = calcularPlanoDiario({
    saldoAtual: -100_00,
    reserva: 0,
    contasPendentes: 115_00,
    dataAtual: '2026-07-01',
    dataProximoRecebimento: '2026-07-09',
    gastosRegistrados: [],
  });

  assert.equal(resultado.valorDisponivel, -215_00);
  assert.equal(resultado.limitePlanejadoHoje, -26_88);
  assert.equal(resultado.excedenteHoje, 0);
});

test('déficit considera todo gasto de hoje como excedente', () => {
  const resultado = calcularPlanoDiario({
    saldoAtual: -130_00,
    reserva: 0,
    contasPendentes: 115_00,
    dataAtual: '2026-07-01',
    dataProximoRecebimento: '2026-07-09',
    gastosRegistrados: [{ id: 'gasto-1', valor: 30_00, data: '2026-07-01' }],
  });

  assert.ok(resultado.limitePlanejadoHoje < 0);
  assert.equal(resultado.totalGastosHoje, 30_00);
  assert.equal(resultado.excedenteHoje, 30_00);
});
