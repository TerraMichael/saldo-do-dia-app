import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { CHAVE_APARENCIA } from '../src/storage/appearance-storage';
import { CHAVE_PLANEJAMENTO } from '../src/storage/planning-storage';
import {
  ESTADO_TUTORIAL_PADRAO,
  PASSOS_APRESENTACAO,
  PASSOS_TOUR_HOME,
  resolverDestinoInicial,
  validarEstadoTutorial,
} from '../src/features/tutorial/model';
import {
  CHAVE_TUTORIAL,
  criarArmazenamentoTutorial,
} from '../src/features/tutorial/storage';

async function ler(caminho: string) {
  return readFile(new URL(caminho, import.meta.url), 'utf8');
}

test('estado educativo padrão usa versão 1 e começa pendente', () => {
  assert.deepEqual(ESTADO_TUTORIAL_PADRAO, {
    versao: 1,
    apresentacaoConcluida: false,
    tourHomeConcluido: false,
    dicasContextuaisVistas: [],
  });
});

test('estado educativo válido faz round-trip em chave independente', async () => {
  const adapter = new AdaptadorMemoria();
  const storage = criarArmazenamentoTutorial(adapter);
  const state = {
    versao: 1 as const,
    apresentacaoConcluida: true,
    tourHomeConcluido: true,
    dicasContextuaisVistas: ['novo-recebimento'],
  };
  await storage.salvar(state);
  assert.deepEqual(await storage.carregar(), state);
  assert.equal(CHAVE_TUTORIAL, '@saldo-do-dia/tutorial:v1');
  assert.notEqual(CHAVE_TUTORIAL, CHAVE_PLANEJAMENTO);
  assert.notEqual(CHAVE_TUTORIAL, CHAVE_APARENCIA);
});

test('estado educativo inválido é rejeitado sem tocar dados financeiros', async () => {
  for (const invalid of [
    { versao: 2, apresentacaoConcluida: false, tourHomeConcluido: false, dicasContextuaisVistas: [] },
    { versao: 1, apresentacaoConcluida: 'não', tourHomeConcluido: false, dicasContextuaisVistas: [] },
    { versao: 1, apresentacaoConcluida: false, tourHomeConcluido: false, dicasContextuaisVistas: [1] },
    { versao: 1, apresentacaoConcluida: false, tourHomeConcluido: false, dicasContextuaisVistas: [''] },
    { versao: 1, apresentacaoConcluida: false, tourHomeConcluido: false, dicasContextuaisVistas: ['dica', ' dica '] },
  ]) {
    assert.throws(() => validarEstadoTutorial(invalid));
  }

  const financial = '{"versao":3,"dados":"preservados"}';
  const adapter = new AdaptadorMemoria({
    [CHAVE_PLANEJAMENTO]: financial,
    [CHAVE_TUTORIAL]: '{inválido',
  });
  await assert.rejects(() => criarArmazenamentoTutorial(adapter).carregar());
  assert.equal(await adapter.obter(CHAVE_PLANEJAMENTO), financial);
});

test('rota inicial respeita planejamento, apresentação e recuperação', () => {
  assert.equal(resolverDestinoInicial('pronto', false), '/home');
  assert.equal(resolverDestinoInicial('vazio', false), '/apresentacao');
  assert.equal(resolverDestinoInicial('vazio', true), '/onboarding');
  assert.equal(resolverDestinoInicial('editando', true), '/onboarding');
  assert.equal(resolverDestinoInicial('carregando', false), 'carregando');
  assert.equal(resolverDestinoInicial('erro', false), 'recuperacao');
  assert.equal(resolverDestinoInicial('expirado', true), 'recuperacao');
});

test('apresentação possui exatamente os três passos aprovados', () => {
  assert.equal(PASSOS_APRESENTACAO.length, 3);
  assert.equal(PASSOS_APRESENTACAO[0].title, 'Seu dinheiro até o próximo recebimento');
  assert.equal(PASSOS_APRESENTACAO[1].title, 'Um planejamento que se ajusta');
  assert.match(PASSOS_APRESENTACAO[2].eyebrow, /NESTA VERSÃO/);
  assert.match(PASSOS_APRESENTACAO[2].description, /Atualmente/);
  assert.doesNotMatch(JSON.stringify(PASSOS_APRESENTACAO), /em breve/i);
});

test('tour possui quatro alvos na ordem aprovada', () => {
  assert.deepEqual(
    PASSOS_TOUR_HOME.map(({ target }) => target),
    ['limite', 'registrar', 'historico', 'detalhes'],
  );
});

test('provider hidrata com fallback e atualiza a sessão antes da persistência', async () => {
  const source = await ler('../src/features/tutorial/context.tsx');
  assert.match(source, /\.catch\(\(\) => \{/);
  assert.match(source, /setState\(ESTADO_TUTORIAL_PADRAO\)/);
  assert.match(source, /\.finally\(\(\) => \{/);
  assert.match(source, /setReady\(true\)/);
  assert.ok(source.indexOf('setState(proximo)') < source.indexOf('armazenamento.salvar(proximo)'));
});

test('tutorial participa da splash sem substituir Stack', async () => {
  const root = await ler('../app/_layout.tsx');
  assert.match(root, /planningReady && themeReady && tutorialReady/);
  assert.match(root, /<TutorialProvider>/);
  assert.match(root, /<Stack screenOptions=\{\{ headerShown: false \}\} \/>/);
});

test('apresentação distingue primeiro uso e modo revisão', async () => {
  const [route, screen] = await Promise.all([
    ler('../app/apresentacao.tsx'),
    ler('../src/features/tutorial/components/IntroductionScreen.tsx'),
  ]);
  assert.match(route, /modo === 'revisao'/);
  assert.match(screen, /completeIntroduction/);
  assert.match(screen, /Voltar às configurações/);
  assert.match(screen, /router\.replace\('\/onboarding'\)/);
  assert.match(screen, /router\.dismissTo\('\/configuracoes'\)/);
});

test('formulário possui as quatro explicações e texto local temporal', async () => {
  const form = await ler('../src/features/onboarding/components/OnboardingForm.tsx');
  assert.match(form, /O valor disponível agora antes dos gastos/);
  assert.match(form, /A data em que você espera receber novamente/);
  assert.match(form, /Contas que ainda serão pagas/);
  assert.match(form, /Dinheiro que você deseja proteger/);
  assert.match(form, /Nesta versão, seus dados ficam salvos/);
});

test('tour isola o fundo, respeita movimento reduzido e não executa os alvos', async () => {
  const [home, tour] = await Promise.all([
    ler('../src/features/home/components/HomeScreen.tsx'),
    ler('../src/features/tutorial/components/HomeTour.tsx'),
  ]);
  assert.match(home, /contentAccessibilityHidden=\{tourVisible\}/);
  assert.match(home, /overlay=\{/);
  assert.match(home, /scrollTo\(/);
  assert.match(home, /animated: !reduceMotion/);
  assert.match(tour, /accessibilityViewIsModal/);
  assert.match(tour, /useReducedMotion/);
  assert.match(tour, /Pular tour/);
  assert.match(tour, /BackHandler/);
});

test('dica de novo recebimento é contextual e revisão mantém aviso permanente', async () => {
  const [tip, form, review] = await Promise.all([
    ler('../src/features/tutorial/components/NewCycleTip.tsx'),
    ler('../src/features/cycle/components/NewCycleForm.tsx'),
    ler('../src/features/cycle/components/NewCycleReview.tsx'),
  ]);
  assert.match(form, /<NewCycleTip \/>/);
  assert.match(tip, /DICA_NOVO_RECEBIMENTO/);
  assert.match(tip, /Seu ciclo atual ficará salvo/);
  assert.match(review, /O ciclo atual será encerrado e ficará disponível em Ciclos anteriores/);
  assert.match(review, /O novo ciclo começará sem gastos registrados/);
});

test('Configurações permite rever apresentação e repetir apenas o tour', async () => {
  const settings = await ler('../src/features/settings/components/SettingsScreen.tsx');
  const context = await ler('../src/features/tutorial/context.tsx');
  assert.match(settings, /\sAjuda\s/);
  assert.match(settings, /Ver apresentação do aplicativo/);
  assert.match(settings, /modo: 'revisao'/);
  assert.match(settings, /Repetir tour da tela inicial/);
  assert.match(settings, /resetHomeTour/);
  assert.match(settings, /router\.dismissTo\('\/home'\)/);
  assert.match(context, /tourHomeConcluido: false/);
});

test('tutorial não entra na persistência financeira ou de aparência', async () => {
  const [serialization, planning, appearance] = await Promise.all([
    ler('../src/storage/serialization.ts'),
    ler('../src/storage/planning-storage.ts'),
    ler('../src/storage/appearance-storage.ts'),
  ]);
  for (const source of [serialization, planning, appearance]) {
    assert.doesNotMatch(source, /CHAVE_TUTORIAL|EstadoTutorialV1/);
  }
  assert.match(serialization, /VERSAO_PLANEJAMENTO_PERSISTIDO = 3/);
});
