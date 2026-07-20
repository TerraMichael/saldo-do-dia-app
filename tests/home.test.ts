import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  assert.equal(apresentacao.restanteHoje, 'R$ 0,00');
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
  assert.equal(apresentacao.restanteHoje, 'R$ 0,00');
  assert.equal(apresentacao.valorDisponivel, 'R$ 0,00');
  assert.equal(apresentacao.deficit, 'R$ 50,00');
  assert.equal(apresentacao.excedenteHoje, null);
  assert.match(apresentacao.mensagemEstado, /Faltam R\$ 50,00/);
});

test('não apresenta excedente na Home quando há déficit sem gasto hoje', () => {
  const configuracao: EntradaCalculoDiario = {
    saldoAtual: -100_00,
    reserva: 0,
    contasPendentes: 115_00,
    dataAtual: '2026-07-01',
    dataProximoRecebimento: '2026-07-09',
    gastosRegistrados: [],
  };
  const resultado = calcularPlanoDiario(configuracao);
  const apresentacao = criarApresentacaoHome(configuracao, resultado);

  assert.equal(apresentacao.deficit, 'R$ 215,00');
  assert.equal(resultado.excedenteHoje, 0);
  assert.equal(apresentacao.excedenteHoje, null);
});

test('formata o limite diário em moeda brasileira', () => {
  const apresentacao = criarApresentacaoHome(
    configuracaoBase,
    calcularPlanoDiario(configuracaoBase),
  );

  assert.equal(apresentacao.restanteHoje, 'R$ 100,00');
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
  assert.equal(apresentacao.restanteHoje, 'R$ 200,00');
  assert.equal(apresentacao.quantidadeDeDiasTexto, '5 dias');
});

test('apresenta restante, excedente e limite futuro após gasto acima do limite diário', () => {
  const configuracao: EntradaCalculoDiario = {
    saldoAtual: 270_00,
    reserva: 0,
    contasPendentes: 115_00,
    dataAtual: '2026-07-01',
    dataProximoRecebimento: '2026-07-09',
    gastosRegistrados: [{ id: 'gasto-1', valor: 30_00, data: '2026-07-01' }],
  };
  const apresentacao = criarApresentacaoHome(
    configuracao,
    calcularPlanoDiario(configuracao),
  );

  assert.equal(apresentacao.restanteHoje, 'R$ 0,00');
  assert.equal(apresentacao.gastoHoje, 'R$ 30,00');
  assert.equal(apresentacao.limitePlanejadoHoje, 'R$ 23,12');
  assert.equal(apresentacao.excedenteHoje, 'R$ 6,88');
  assert.equal(apresentacao.limiteDiasFuturos, 'R$ 22,14');
  assert.equal(apresentacao.quantidadeDeDiasFuturos, 7);
});

test('CollapsibleSection é exportado e começa recolhido por padrão', async () => {
  const [component, exports] = await Promise.all([
    readFile(
      new URL('../src/ui/components/CollapsibleSection.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../src/ui/index.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(exports, /export \{ CollapsibleSection \}/);
  assert.match(component, /initiallyExpanded = false/);
  assert.match(component, /useState\(initiallyExpanded\)/);
  assert.match(component, /initiallyExpanded\?: boolean/);
});

test('cabeçalho recolhível comunica estado e ação à acessibilidade', async () => {
  const component = await readFile(
    new URL('../src/ui/components/CollapsibleSection.tsx', import.meta.url),
    'utf8',
  );

  assert.match(component, /accessibilityRole="button"/);
  assert.match(component, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(component, /expanded \? 'Recolher' : 'Expandir'/);
  assert.match(component, /accessibilityHint=/);
});

test('chevron do controle recolhível é decorativo e acompanha o estado', async () => {
  const component = await readFile(
    new URL('../src/ui/components/CollapsibleSection.tsx', import.meta.url),
    'utf8',
  );

  assert.match(component, /name="chevron-down"/);
  assert.match(component, /withTiming\(expanded \? 180 : 0/);
  assert.match(component, /rotate: `\$\{chevronRotation\.value\}deg`/);
  assert.match(component, /accessible=\{false\}/);
  assert.match(component, /accessibilityElementsHidden/);
  assert.match(component, /importantForAccessibility="no-hide-descendants"/);
});

test('Home mantém ações prioritárias fora dos detalhes e opções dentro', async () => {
  const home = await readFile(
    new URL('../src/features/home/components/HomeScreen.tsx', import.meta.url),
    'utf8',
  );
  const detailsStart = home.indexOf('<CollapsibleSection');
  const detailsEnd = home.indexOf('</CollapsibleSection>');

  assert.ok(home.indexOf('label="Registrar gasto"') < detailsStart);
  assert.ok(home.indexOf('label="Ver histórico"') < detailsStart);
  assert.ok(home.indexOf('label="Editar planejamento"') > detailsStart);
  assert.ok(home.indexOf('label="Editar planejamento"') < detailsEnd);
  assert.ok(home.indexOf('label="Novo recebimento"') > detailsStart);
  assert.ok(home.indexOf('label="Novo recebimento"') < detailsEnd);
});

test('déficit e excedente permanecem visíveis fora dos detalhes', async () => {
  const home = await readFile(
    new URL('../src/features/home/components/HomeScreen.tsx', import.meta.url),
    'utf8',
  );
  const detailsStart = home.indexOf('<CollapsibleSection');

  assert.ok(home.indexOf('message={`Déficit: ${apresentacao.deficit}`}') < detailsStart);
  assert.ok(
    home.indexOf(
      'message={`Excedente de hoje: ${apresentacao.excedenteHoje}`}',
    ) < detailsStart,
  );
});

test('Home reutiliza o presenter e preserva os destinos sem acesso à persistência', async () => {
  const home = await readFile(
    new URL('../src/features/home/components/HomeScreen.tsx', import.meta.url),
    'utf8',
  );

  assert.match(home, /criarApresentacaoHome\(configuracao, resultado\)/);
  assert.doesNotMatch(home, /calcularPlanoDiario|AsyncStorage|saldoAtual\s*-/);
  assert.match(home, /router\.push\('\/registrar-gasto'\)/);
  assert.match(home, /router\.push\('\/historico'\)/);
  assert.match(home, /router\.push\('\/onboarding'\)/);
  assert.match(home, /router\.push\('\/novo-ciclo'\)/);
});
