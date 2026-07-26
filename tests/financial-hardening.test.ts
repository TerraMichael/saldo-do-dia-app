import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calcularLimiteDiario,
  calcularPlanoDiario,
  calcularQuantidadeDeDiasRestantes,
  calcularValorDisponivel,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
  type GastoRegistrado,
} from '../src/features/daily-limit';
import {
  calcularPlanoReferencia,
  criarGeradorDeterministico,
} from './support/financial-reference-model';

const SEED = Number(process.env.FINANCIAL_TEST_SEED ?? 0x5a1d0d1a);
const TODAY = '2026-01-01';

function input(
  overrides: Partial<EntradaCalculoDiario> = {},
): EntradaCalculoDiario {
  return {
    saldoAtual: 100_00,
    reserva: 10_00,
    contasPendentes: 20_00,
    dataAtual: TODAY,
    dataProximoRecebimento: '2026-01-08',
    gastosRegistrados: [],
    ...overrides,
  };
}

test('arredondamento conservador cobre positivos, negativos e divisões exatas', () => {
  assert.equal(calcularLimiteDiario(1001, 3), 333);
  assert.equal(calcularLimiteDiario(1000, 3), 333);
  assert.equal(calcularLimiteDiario(-1001, 3), -334);
  assert.equal(calcularLimiteDiario(-1000, 3), -334);
  assert.equal(calcularLimiteDiario(999, 3), 333);
  assert.equal(calcularLimiteDiario(-999, 3), -333);
});

test('matriz combinatória determinística coincide com o oráculo independente', () => {
  const balances = [0, 1, 100, 1001, 10_000, 100_000, -100, 5_000_000_00];
  const bills = [0, 1, 500, 10_000, 100_000, 1_000_000];
  const reserves = [0, 1, 250, 10_000, 100_000, 500_000];
  const days = [0, 1, 2, 3, 7, 15, 30, 31, 365];
  let scenarios = 0;

  for (let index = 0; index < 720; index += 1) {
    const dayCount = days[index % days.length];
    const date = new Date(Date.UTC(2026, 0, 1 + dayCount));
    const receive = date.toISOString().slice(0, 10);
    const todayExpenses =
      index % 5 === 0
        ? [
            { id: `a-${index}`, valor: 1, data: TODAY },
            { id: `b-${index}`, valor: 999, data: TODAY, descricao: 'Teste' },
          ]
        : index % 3 === 0
          ? [{ id: `old-${index}`, valor: 500, data: '2025-12-31' }]
          : [];
    const scenario = input({
      saldoAtual: balances[index % balances.length],
      contasPendentes: bills[(index * 3) % bills.length],
      reserva: reserves[(index * 5) % reserves.length],
      dataProximoRecebimento: receive,
      gastosRegistrados: todayExpenses,
    });
    const actual = calcularPlanoDiario(scenario);
    const expected = calcularPlanoReferencia(scenario);
    assert.deepEqual(
      actual,
      expected,
      `cenário=${index} entrada=${JSON.stringify(scenario)}`,
    );
    scenarios += 1;
  }

  assert.equal(scenarios, 720);
});

test('datas civis cobrem viradas, fevereiro bissexto e calendários inválidos', () => {
  const validPairs = [
    ['2024-02-28', '2024-02-29'],
    ['2024-02-29', '2024-03-01'],
    ['2026-02-28', '2026-03-01'],
    ['2026-04-30', '2026-05-01'],
    ['2026-12-31', '2027-01-01'],
  ] as const;
  for (const [current, next] of validPairs) {
    assert.equal(
      calcularPlanoDiario(
        input({ dataAtual: current, dataProximoRecebimento: next }),
      ).quantidadeDeDiasRestantes,
      1,
    );
  }
  for (const invalid of [
    '',
    '2026-1-01',
    '01/01/2026',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-02-29',
    '2026-04-31',
    ' 2026-01-01 ',
  ]) {
    assert.throws(
      () => calcularPlanoDiario(input({ dataAtual: invalid })),
      (error) =>
        error instanceof ErroCalculoFinanceiro &&
        error.codigo === 'DATA_INVALIDA',
    );
  }
});

test('propriedades financeiras são válidas em 1000 casos reproduzíveis', () => {
  const random = criarGeradorDeterministico(SEED);
  for (let index = 0; index < 1000; index += 1) {
    const cents = () => Math.floor(random() * 1_000_000);
    const dayCount = Math.floor(random() * 365);
    const receive = new Date(Date.UTC(2026, 0, 1 + dayCount))
      .toISOString()
      .slice(0, 10);
    const expenses: GastoRegistrado[] = Array.from(
      { length: Math.floor(random() * 12) },
      (_, expenseIndex) => ({
        id: `seed-${SEED}-${index}-${expenseIndex}`,
        valor: Math.max(1, cents()),
        data: random() > 0.5 ? TODAY : '2025-12-31',
        ...(random() > 0.5 ? { descricao: 'Descrição arbitrária' } : {}),
      }),
    );
    const scenario = input({
      saldoAtual: random() > 0.15 ? cents() : -cents(),
      reserva: cents(),
      contasPendentes: cents(),
      dataProximoRecebimento: receive,
      gastosRegistrados: expenses,
    });
    const before = structuredClone(scenario);
    const result = calcularPlanoDiario(scenario);
    const total = expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const today = expenses.reduce(
      (sum, expense) =>
        sum + (expense.data === TODAY ? expense.valor : 0),
      0,
    );

    assert.equal(
      result.valorDisponivel,
      scenario.saldoAtual - scenario.reserva - scenario.contasPendentes,
      `seed=${SEED} case=${index}`,
    );
    assert.equal(result.totalGastosRegistrados, total);
    assert.equal(result.totalGastosHoje, today);
    assert.ok(result.restanteHoje >= 0);
    assert.ok(result.excedenteHoje >= 0);
    assert.ok(Number.isSafeInteger(result.quantidadeDeDiasRestantes));
    assert.ok(result.quantidadeDeDiasRestantes >= 1);
    assert.equal(
      result.quantidadeDeDiasFuturos,
      Math.max(0, result.quantidadeDeDiasRestantes - 1),
    );
    assert.equal(
      result.quantidadeDeDiasFuturos === 0,
      result.limiteDiasFuturos === null,
    );
    for (const value of Object.values(result)) {
      if (value !== null) {
        assert.equal(Number.isSafeInteger(value), true);
        assert.equal(Number.isFinite(value), true);
      }
    }
    assert.deepEqual(scenario, before);
    assert.deepEqual(calcularPlanoDiario(scenario), result);
  }
});

test('metamorfismos preservam as relações esperadas', () => {
  const expenses = [
    { id: 'one', valor: 300, data: TODAY, descricao: 'A' },
    { id: 'two', valor: 700, data: TODAY, descricao: 'B' },
  ];
  const base = input({ gastosRegistrados: expenses });
  const result = calcularPlanoDiario(base);
  assert.equal(
    calcularPlanoDiario({ ...base, saldoAtual: base.saldoAtual + 123 })
      .valorDisponivel,
    result.valorDisponivel + 123,
  );
  assert.equal(
    calcularPlanoDiario({ ...base, reserva: base.reserva + 123 })
      .valorDisponivel,
    result.valorDisponivel - 123,
  );
  assert.equal(
    calcularPlanoDiario({ ...base, contasPendentes: base.contasPendentes + 123 })
      .valorDisponivel,
    result.valorDisponivel - 123,
  );
  const joined = [{ id: 'joined', valor: 1000, data: TODAY }];
  assert.deepEqual(
    calcularPlanoDiario({ ...base, gastosRegistrados: joined }),
    result,
  );
  assert.deepEqual(
    calcularPlanoDiario({
      ...base,
      gastosRegistrados: [...expenses].reverse().map((expense, index) => ({
        ...expense,
        id: `changed-${index}`,
        descricao: 'Outra',
      })),
    }),
    result,
  );
  const nextDay = calcularPlanoDiario({
    ...base,
    dataAtual: '2026-01-02',
  });
  assert.equal(nextDay.totalGastosHoje, 0);
});

test('valida sinais, valores especiais, frações e overflow sem estado parcial', () => {
  for (const invalid of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.MIN_SAFE_INTEGER - 1,
  ]) {
    assert.throws(
      () => calcularPlanoDiario(input({ saldoAtual: invalid })),
      (error) =>
        error instanceof ErroCalculoFinanceiro &&
        error.codigo === 'VALOR_MONETARIO_INVALIDO',
    );
  }
  assert.throws(() => calcularPlanoDiario(input({ reserva: -1 })));
  assert.throws(() => calcularPlanoDiario(input({ contasPendentes: -1 })));
  assert.throws(() => calcularValorDisponivel(0, -1, 0));
  assert.throws(() => calcularValorDisponivel(0, 0, -1));
  assert.throws(() => calcularLimiteDiario(100, 0));
  assert.throws(() => calcularLimiteDiario(100, 1.5));
  assert.throws(() =>
    calcularQuantidadeDeDiasRestantes('2026-01-02', '2026-01-01'),
  );
  assert.throws(() =>
    calcularPlanoDiario(
      input({
        gastosRegistrados: [{ id: 'invalid', valor: 0, data: TODAY }],
      }),
    ),
  );
  assert.throws(() =>
    calcularPlanoDiario(
      input({
        gastosRegistrados: [{ id: 'negative', valor: -1, data: TODAY }],
      }),
    ),
  );
  assert.throws(() =>
    calcularPlanoDiario(
      input({
        gastosRegistrados: [{ id: 'date', valor: 1, data: '2026-02-30' }],
      }),
    ),
  );
  assert.throws(() =>
    calcularPlanoDiario(
      input({
        saldoAtual: Number.MIN_SAFE_INTEGER,
        contasPendentes: 1,
      }),
    ),
  );
  assert.throws(() =>
    calcularPlanoDiario(
      input({
        gastosRegistrados: [
          { id: 'a', valor: Number.MAX_SAFE_INTEGER, data: TODAY },
          { id: 'b', valor: 1, data: TODAY },
        ],
      }),
    ),
  );
});
