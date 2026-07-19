import assert from 'node:assert/strict';
import test from 'node:test';

import { calcularPlanoDiario } from '../src/features/daily-limit/index';
import {
  criarConfiguracaoInicial,
  criarDataLocalDaDataCivil,
  ErroOnboarding,
  formatarCentavosComoMoedaBrasileira,
  formatarDataLocalComoCivil,
  converterMoedaBrasileiraParaCentavos,
} from '../src/features/onboarding/model';

test('converte moeda brasileira para centavos', () => {
  assert.equal(converterMoedaBrasileiraParaCentavos('R$ 1.234,56'), 123_456);
  assert.equal(converterMoedaBrasileiraParaCentavos('10,5'), 1_050);
});

test('formata centavos como moeda brasileira', () => {
  assert.equal(formatarCentavosComoMoedaBrasileira(123_456), 'R$ 1.234,56');
  assert.equal(formatarCentavosComoMoedaBrasileira(0), 'R$ 0,00');
});

test('preserva saldo negativo na conversão e na configuração', () => {
  assert.equal(converterMoedaBrasileiraParaCentavos('-1.234,56'), -123_456);
  const configuracao = criarConfiguracaoInicial(
    {
      saldoAtual: 'R$ -100,00',
      dataProximoRecebimento: '2026-07-20',
    },
    '2026-07-18',
  );
  assert.equal(configuracao.saldoAtual, -10_000);
});

test('rejeita valor monetário inválido', () => {
  assert.throws(
    () => converterMoedaBrasileiraParaCentavos('1.23,4x'),
    (erro) => erro instanceof ErroOnboarding && erro.codigo === 'VALOR_INVALIDO',
  );
});

test('rejeita contas pendentes negativas', () => {
  assert.throws(
    () =>
      criarConfiguracaoInicial(
        {
          saldoAtual: '100,00',
          contasPendentes: '-1,00',
          dataProximoRecebimento: '2026-07-20',
        },
        '2026-07-18',
      ),
    (erro) =>
      erro instanceof ErroOnboarding &&
      erro.campo === 'contasPendentes' &&
      erro.codigo === 'VALOR_NEGATIVO',
  );
});

test('rejeita reserva negativa', () => {
  assert.throws(
    () =>
      criarConfiguracaoInicial(
        {
          saldoAtual: '100,00',
          reserva: '-1,00',
          dataProximoRecebimento: '2026-07-20',
        },
        '2026-07-18',
      ),
    (erro) =>
      erro instanceof ErroOnboarding &&
      erro.campo === 'reserva' &&
      erro.codigo === 'VALOR_NEGATIVO',
  );
});

test('rejeita data anterior ao dia atual', () => {
  assert.throws(
    () =>
      criarConfiguracaoInicial(
        {
          saldoAtual: '100,00',
          dataProximoRecebimento: '2026-07-17',
        },
        '2026-07-18',
      ),
    (erro) =>
      erro instanceof ErroOnboarding &&
      erro.campo === 'dataProximoRecebimento' &&
      erro.codigo === 'DATA_INVALIDA',
  );
});

test('mantém uma data local válida sem deslocamento de dia', () => {
  const dataCivil = '2026-07-20';
  assert.equal(formatarDataLocalComoCivil(criarDataLocalDaDataCivil(dataCivil)), dataCivil);
});

test('cria corretamente o objeto de configuração com valores padrão', () => {
  assert.deepEqual(
    criarConfiguracaoInicial(
      {
        saldoAtual: 'R$ 2.000,00',
        contasPendentes: '',
        reserva: '',
        dataProximoRecebimento: '2026-07-22',
      },
      '2026-07-18',
    ),
    {
      saldoAtual: 200_000,
      contasPendentes: 0,
      reserva: 0,
      dataAtual: '2026-07-18',
      dataProximoRecebimento: '2026-07-22',
      gastosRegistrados: [],
    },
  );
});

test('integra a configuração do onboarding com o cálculo diário existente', () => {
  const configuracao = criarConfiguracaoInicial(
    {
      saldoAtual: 'R$ 1.000,00',
      contasPendentes: 'R$ 200,00',
      reserva: 'R$ 100,00',
      dataProximoRecebimento: '2026-07-25',
    },
    '2026-07-18',
  );

  assert.deepEqual(calcularPlanoDiario(configuracao), {
    valorDisponivel: 70_000,
    limiteDiario: 10_000,
    quantidadeDeDiasRestantes: 7,
    totalGastosRegistrados: 0,
  });
});
