import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createSplashHideCoordinator } from '../src/ui/splash-hide-coordinator';

function deferred() {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function settlePromises() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

function createHarness({ fallbackThrows = false } = {}) {
  const pending: Array<{ callback: () => void; cancelled: boolean }> = [];
  let asyncCalls = 0;
  let fallbackCalls = 0;
  let warnings = 0;
  const asyncResults: Array<ReturnType<typeof deferred>> = [];

  const coordinator = createSplashHideCoordinator({
    hideAsync: () => {
      asyncCalls += 1;
      const result = deferred();
      asyncResults.push(result);
      return result.promise;
    },
    hide: () => {
      fallbackCalls += 1;
      if (fallbackThrows) throw new Error('fallback indisponível');
    },
    scheduleRetry: (callback) => {
      const retry = { callback, cancelled: false };
      pending.push(retry);
      return { cancel: () => (retry.cancelled = true) };
    },
    warn: () => {
      warnings += 1;
    },
  });

  return {
    coordinator,
    asyncResults,
    pending,
    get asyncCalls() {
      return asyncCalls;
    },
    get fallbackCalls() {
      return fallbackCalls;
    },
    get warnings() {
      return warnings;
    },
    runNextRetry() {
      const retry = pending.shift();
      if (retry && !retry.cancelled) retry.callback();
    },
  };
}

test('Root Layout mantém o Stack montado durante a hidratação', async () => {
  const source = await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8');

  assert.match(source, /<Stack screenOptions=\{\{ headerShown: false \}\} \/>/);
  assert.doesNotMatch(source, /hydrationReady\s*\?\s*\(\s*<Stack/);
});

test('LaunchSplashController envolve, mas não substitui o navegador', async () => {
  const source = await readFile(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  const controllerStart = source.indexOf('<LaunchSplashController');
  const stack = source.indexOf('<Stack');
  const controllerEnd = source.indexOf('</LaunchSplashController>');

  assert.ok(controllerStart >= 0 && stack > controllerStart && controllerEnd > stack);
});

test('hideAsync só é chamado depois do sinal de tela pronta', () => {
  const harness = createHarness();

  assert.equal(harness.asyncCalls, 0);
  harness.coordinator.markReady();
  assert.equal(harness.asyncCalls, 1);
});

test('controller ignora layout enquanto a hidratação não terminou', async () => {
  const source = await readFile(
    new URL('../src/ui/components/LaunchSplashController.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /if \(!hydrationReady\) return;/);
  assert.match(source, /coordinator\.current\?\.markReady\(\)/);
});

test('múltiplos layouts não geram chamadas simultâneas', () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.coordinator.markReady();
  harness.coordinator.markReady();

  assert.equal(harness.asyncCalls, 1);
});

test('sucesso impede novas chamadas', async () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.asyncResults[0].resolve();
  await settlePromises();
  harness.coordinator.markReady();

  assert.equal(harness.asyncCalls, 1);
  assert.equal(harness.fallbackCalls, 0);
});

test('primeira falha permite uma segunda tentativa limitada', async () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.asyncResults[0].reject();
  await settlePromises();
  assert.equal(harness.pending.length, 1);

  harness.runNextRetry();
  assert.equal(harness.asyncCalls, 2);
});

test('duas falhas acionam hide como fallback final', async () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.asyncResults[0].reject();
  await settlePromises();
  harness.runNextRetry();
  harness.asyncResults[1].reject();
  await settlePromises();

  assert.equal(harness.asyncCalls, 2);
  assert.equal(harness.fallbackCalls, 1);
});

test('fallback bem-sucedido não entra em loop', async () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.asyncResults[0].reject();
  await settlePromises();
  harness.runNextRetry();
  harness.asyncResults[1].reject();
  await settlePromises();
  harness.coordinator.markReady();

  assert.equal(harness.asyncCalls, 2);
  assert.equal(harness.fallbackCalls, 1);
  assert.equal(harness.warnings, 0);
});

test('falha do fallback avisa uma vez e não entra em loop', async () => {
  const harness = createHarness({ fallbackThrows: true });

  harness.coordinator.markReady();
  harness.asyncResults[0].reject();
  await settlePromises();
  harness.runNextRetry();
  harness.asyncResults[1].reject();
  await settlePromises();
  harness.coordinator.markReady();

  assert.equal(harness.asyncCalls, 2);
  assert.equal(harness.fallbackCalls, 1);
  assert.equal(harness.warnings, 1);
});

test('unmount cancela a tentativa pendente', async () => {
  const harness = createHarness();

  harness.coordinator.markReady();
  harness.asyncResults[0].reject();
  await settlePromises();
  const retry = harness.pending[0];
  harness.coordinator.dispose();
  harness.runNextRetry();

  assert.equal(retry.cancelled, true);
  assert.equal(harness.asyncCalls, 1);
  assert.equal(harness.fallbackCalls, 0);
});

test('AppButton preserva label, override, role e estados acessíveis', async () => {
  const source = await readFile(
    new URL('../src/ui/components/AppButton.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /accessibilityLabel=\{accessibilityLabel \?\? label\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ busy: processing, disabled: indisponivel \}\}/);
  assert.match(source, /<Text[^>]*>\{label\}<\/Text>/);
});

test('ícones decorativos não são expostos à acessibilidade', async () => {
  const files = [
    '../src/ui/components/AppButton.tsx',
    '../src/ui/components/AppHeader.tsx',
    '../src/ui/components/InlineFeedback.tsx',
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /<MaterialCommunityIcons[\s\S]*?accessible=\{false\}/);
    assert.match(source, /importantForAccessibility="no-hide-descendants"/);
    assert.match(source, /accessibilityElementsHidden/);
  }
});

test('InlineFeedback mantém mensagem textual além do ícone oculto', async () => {
  const source = await readFile(
    new URL('../src/ui/components/InlineFeedback.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /accessible=\{false\}/);
  assert.match(source, />\{message\}<\/Text>/);
});
