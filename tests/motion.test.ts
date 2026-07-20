import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  APP_FEEDBACK_INITIAL_STATE,
  reduceAppFeedback,
} from '../src/ui/feedback/model';
import { motion } from '../src/ui/motion/tokens';

async function ler(caminho: string) {
  return readFile(new URL(caminho, import.meta.url), 'utf8');
}

test('dependências oficiais de movimento estão instaladas sem concorrentes', async () => {
  const pacote = JSON.parse(await ler('../package.json'));

  assert.ok(pacote.dependencies['react-native-reanimated']);
  assert.ok(pacote.dependencies['react-native-worklets']);
  for (const concorrente of ['moti', 'lottie-react-native', 'react-native-animatable']) {
    assert.equal(pacote.dependencies[concorrente], undefined);
  }
});

test('tokens de duração são inteiros não negativos e interações não excedem 300 ms', () => {
  for (const value of Object.values(motion.duration)) {
    assert.equal(Number.isInteger(value), true);
    assert.ok(value >= 0);
  }

  for (const key of ['pressIn', 'pressOut', 'fast', 'standard', 'emphasized'] as const) {
    assert.ok(motion.duration[key] <= 300, key);
  }
  assert.ok(motion.duration.feedbackVisible >= 2000);
});

test('escalas e distâncias permanecem discretas', () => {
  assert.ok(motion.scale.pressed > 0 && motion.scale.pressed < 1);
  assert.ok(motion.scale.loadingMin >= 0.98);
  assert.ok(motion.scale.loadingMax <= 1.02);
  assert.ok(motion.distance.subtle <= 6);
  assert.ok(motion.distance.small <= 8);
});

test('estado de feedback inicia vazio, cria IDs e substitui mensagens', () => {
  assert.equal(APP_FEEDBACK_INITIAL_STATE.current, null);
  const primeiro = reduceAppFeedback(APP_FEEDBACK_INITIAL_STATE, {
    type: 'show',
    message: 'Gasto registrado',
    variant: 'success',
  });
  const segundo = reduceAppFeedback(primeiro, {
    type: 'show',
    message: 'Gasto excluído',
    variant: 'success',
  });

  assert.ok(primeiro.current?.id);
  assert.equal(primeiro.current?.message, 'Gasto registrado');
  assert.equal(segundo.current?.message, 'Gasto excluído');
  assert.notEqual(segundo.current?.id, primeiro.current?.id);
  assert.equal(
    reduceAppFeedback(segundo, { type: 'dismiss' }).current,
    null,
  );
});

test('configuração global segue redução de movimento do sistema', async () => {
  const root = await ler('../app/_layout.tsx');
  assert.match(root, /ReducedMotionConfig mode=\{ReduceMotion\.System\}/);
  assert.match(root, /<Stack screenOptions=\{\{ headerShown: false \}\} \/>/);
});

test('AppButton preserva acessibilidade e desativa movimento quando indisponível', async () => {
  const source = await ler('../src/ui/components/AppButton.tsx');
  assert.match(source, /accessibilityLabel=\{accessibilityLabel \?\? label\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /busy: processing, disabled: indisponivel/);
  assert.match(source, /if \(indisponivel\) return/);
  assert.match(source, /useReducedMotion\(\)/);
});

test('seção recolhível preserva contrato acessível e movimento reduzido', async () => {
  const source = await ler('../src/ui/components/CollapsibleSection.tsx');
  assert.match(source, /initiallyExpanded = false/);
  assert.match(source, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(source, /expanded \? 'Recolher' : 'Expandir'/);
  assert.match(source, /ReduceMotion\.System/);
  assert.match(source, /accessible=\{false\}/);
});

test('valor principal não anima na primeira montagem e preserva label', async () => {
  const [component, home] = await Promise.all([
    ler('../src/ui/components/AnimatedValueText.tsx'),
    ler('../src/features/home/components/HomeScreen.tsx'),
  ]);
  assert.match(component, /!mounted\.current/);
  assert.match(component, /active && value !== displayedValue/);
  assert.match(component, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(component, /key=\{displayedValue\}/);
  assert.match(home, /<AnimatedValueText/);
  assert.match(home, /active=\{screenFocused\}/);
});

test('loading mantém textos, respeita redução e cancela animação', async () => {
  const source = await ler('../src/ui/components/LaunchLoadingScreen.tsx');
  assert.match(source, /Saldo do Dia/);
  assert.match(source, /Carregando seu planejamento/);
  assert.match(source, /useReducedMotion\(\)/);
  assert.match(source, /cancelAnimation\(scale\)/);
  assert.match(source, /subscription\.remove\(\)/);
  assert.doesNotMatch(source, /setTimeout/);
});

test('feedback global é efêmero, acessível e não persiste mensagens', async () => {
  const [provider, host] = await Promise.all([
    ler('../src/ui/feedback/AppFeedbackProvider.tsx'),
    ler('../src/ui/feedback/AppFeedbackHost.tsx'),
  ]);
  assert.match(provider, /motion\.duration\.feedbackVisible/);
  assert.match(provider, /clearTimeout/);
  assert.doesNotMatch(provider, /AsyncStorage|armazenamento/);
  assert.match(host, /accessibilityLiveRegion="polite"/);
  assert.match(host, /pointerEvents="box-none"/);
});

test('sucessos só são emitidos depois das operações persistidas', async () => {
  const [registro, edicao, historico] = await Promise.all([
    ler('../src/features/expenses/components/ExpenseForm.tsx'),
    ler('../src/features/expenses/components/EditExpenseScreen.tsx'),
    ler('../src/features/history/components/HistoryScreen.tsx'),
  ]);

  assert.ok(
    registro.indexOf('await registrarGasto') <
      registro.indexOf("showFeedback('Gasto registrado')"),
  );
  assert.ok(
    edicao.indexOf('await editarGasto') <
      edicao.indexOf("showFeedback('Alteração salva')"),
  );
  assert.match(edicao, /if \(resultadoEdicao\.alterado\)/);
  assert.ok(
    historico.indexOf('void excluirGasto') <
      historico.indexOf("showFeedback('Gasto excluído')"),
  );
  assert.match(historico, /\.catch\(/);
});

test('mensagens de sucesso permanecem codificadas corretamente em UTF-8', async () => {
  const [edicao, historico] = await Promise.all([
    ler('../src/features/expenses/components/EditExpenseScreen.tsx'),
    ler('../src/features/history/components/HistoryScreen.tsx'),
  ]);

  assert.match(edicao, /showFeedback\('Alteração salva'\)/);
  assert.match(historico, /showFeedback\('Gasto excluído'\)/);
  assert.doesNotMatch(`${edicao}${historico}`, /Ã§|Ã­|Ã£/);
});

test('retornos de gastos e histórico descartam duplicações da pilha', async () => {
  const [registro, edicao, historico, ciclos, detalhe] = await Promise.all([
    ler('../src/features/expenses/components/ExpenseForm.tsx'),
    ler('../src/features/expenses/components/EditExpenseScreen.tsx'),
    ler('../src/features/history/components/HistoryScreen.tsx'),
    ler('../src/features/cycle-history/components/CycleHistoryListScreen.tsx'),
    ler('../src/features/cycle-history/components/CycleHistoryDetailScreen.tsx'),
  ]);

  assert.match(registro, /router\.dismissTo\('\/home'\)/);
  assert.match(edicao, /router\.dismissTo\('\/historico'\)/);
  assert.match(historico, /onBack=\{\(\) => router\.dismissTo\('\/home'\)\}/);
  assert.match(ciclos, /router\.dismissTo\('\/historico'\)/);
  assert.match(detalhe, /router\.dismissTo\('\/ciclos' as Href\)/);
});

test('histórico usa somente saída e layout, sem stagger ou entrada global', async () => {
  const source = await ler('../src/features/history/components/HistoryScreen.tsx');
  assert.match(source, /exiting=\{FadeOut/);
  assert.match(source, /layout=\{LinearTransition/);
  assert.doesNotMatch(source, /entering=/);
  assert.doesNotMatch(source, /stagger|delay\(/i);
});

test('movimento não altera persistência financeira, aparência ou rotas', async () => {
  const [serialization, appearance, packageSource] = await Promise.all([
    ler('../src/storage/serialization.ts'),
    ler('../src/storage/appearance-storage.ts'),
    ler('../package.json'),
  ]);
  assert.match(serialization, /VERSAO_PLANEJAMENTO_PERSISTIDO = 3/);
  assert.match(appearance, /@saldo-do-dia\/aparencia:v1/);
  assert.doesNotMatch(serialization, /feedback|motion|anima/);
  assert.match(JSON.parse(packageSource).scripts.test, /tests\/motion\.test\.ts/);
});
