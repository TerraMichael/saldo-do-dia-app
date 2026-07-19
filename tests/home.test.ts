import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
} from '../src/features/daily-limit/index';
import { criarApresentacaoHome } from '../src/features/home/presenter';
import {
  criarConfiguracaoInicial,
  criarDadosFormularioDaConfiguracao,
} from '../src/features/onboarding/model';

const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 100_000,
  reserva: 10_000,
  contasPendentes: 20_000,
  dataAtual: '2026-07-18',
  dataProximoRecebimento: '2026-07-25',
  gastosRegistrados: [],
};

test('cria corretamente os dados apresentados na Home', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.saldoAtual, 'R$ 1.000,00');
  assert.equal(apresentacao.valorDisponivel, 'R$ 700,00');
  assert.equal(apresentacao.contasPendentes, 'R$ 200,00');
  assert.equal(apresentacao.reserva, 'R$ 100,00');
});

test('apresenta situação financeira positiva', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.estado, 'positivo');
  assert.equal(apresentacao.tituloEstado, 'Planejamento positivo');
  assert.equal(apresentacao.deficit, null);
});

test('apresenta valor disponível igual a zero sem valor livre', () => {
  const configuracao = {
    ...configuracaoBase,
    saldoAtual: 30_000,
  };
  const apresentacao = criarApresentacaoHome(configuracao, calcularPlanoDiario(configuracao));

  assert.equal(apresentacao.estado, 'sem-valor-livre');
  assert.equal(apresentacao.limiteDiario, 'R$ 0,00');
  assert.equal(apresentacao.valorDisponivel, 'R$ 0,00');
  assert.match(apresentacao.mensagemEstado, /Não há valor livre/);
});

test('apresenta déficit sem oferecer valor negativo para gastar', () => {
  const configuracao = {
    ...configuracaoBase,
    saldoAtual: 25_000,
  };
  const apresentacao = criarApresentacaoHome(configuracao, calcularPlanoDiario(configuracao));

  assert.equal(apresentacao.estado, 'deficit');
  assert.equal(apresentacao.limiteDiario, 'R$ 0,00');
  assert.equal(apresentacao.valorDisponivel, 'R$ 0,00');
  assert.equal(apresentacao.deficit, 'R$ 50,00');
  assert.match(apresentacao.mensagemEstado, /Faltam R\$ 50,00/);
});

test('formata o limite diário em moeda brasileira', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.limiteDiario, 'R$ 100,00');
});

test('informa a quantidade de dias restante', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.quantidadeDeDiasRestantes, 7);
  assert.equal(apresentacao.quantidadeDeDiasTexto, '7 dias');
});

test('formata a data do próximo recebimento para exibição', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.dataProximoRecebimento, '25/07/2026');
});

test('preserva a configuração atual ao preparar a edição', () => {
  assert.deepEqual(criarDadosFormularioDaConfiguracao(configuracaoBase), {
    saldoAtual: 'R$ 1.000,00',
    contasPendentes: 'R$ 200,00',
    reserva: 'R$ 100,00',
    dataProximoRecebimento: '2026-07-25',
  });
});

test('integra onboarding, cálculo diário e apresentação da Home', () => {
  const configuracao = criarConfiguracaoInicial(
    {
      saldoAtual: 'R$ 1.500,00',
      contasPendentes: 'R$ 300,00',
      reserva: 'R$ 200,00',
      dataProximoRecebimento: '2026-07-23',
    },
    '2026-07-18',
  );
  const resultado = calcularPlanoDiario(configuracao);
  const apresentacao = criarApresentacaoHome(configuracao, resultado);

  assert.equal(resultado.valorDisponivel, 100_000);
  assert.equal(apresentacao.estado, 'positivo');
  assert.equal(apresentacao.limiteDiario, 'R$ 200,00');
  assert.equal(apresentacao.quantidadeDeDiasTexto, '5 dias');
});
