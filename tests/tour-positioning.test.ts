import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  calculateTourPanelPlacement,
  expandRect,
  rectanglesIntersect,
  TOUR_TARGET_GAP,
  type Rect,
} from '../src/features/tutorial/tour-positioning';

const viewport = {
  width: 360,
  height: 800,
  safeAreaTop: 24,
  safeAreaBottom: 24,
  horizontalMargin: 16,
};
const panel = { width: 328, height: 240 };

function placement(target: Rect, customPanel = panel, customViewport = viewport) {
  return calculateTourPanelPlacement(target, customPanel, customViewport);
}

test('posiciona abaixo quando existe espaço', () => {
  const result = placement({ x: 20, y: 100, width: 320, height: 120 });
  assert.equal(result.side, 'below');
  assert.equal(result.y, 220 + TOUR_TARGET_GAP);
});

test('posiciona acima quando não cabe abaixo', () => {
  assert.equal(
    placement({ x: 20, y: 590, width: 320, height: 80 }).side,
    'above',
  );
});

test('quando ambos cabem, prefere abaixo no alto e acima embaixo', () => {
  const shortPanel = { width: 300, height: 180 };
  assert.equal(
    placement({ x: 20, y: 260, width: 320, height: 40 }, shortPanel).side,
    'below',
  );
  assert.equal(
    placement({ x: 20, y: 500, width: 320, height: 40 }, shortPanel).side,
    'above',
  );
});

test('quando nenhum lado comporta tudo, escolhe o maior espaço', () => {
  const result = placement(
    { x: 20, y: 430, width: 320, height: 80 },
    { width: 328, height: 500 },
  );
  assert.equal(result.side, 'above');
  assert.equal(result.needsScroll, true);
});

test('respeita Safe Area superior, inferior e margens laterais', () => {
  const top = placement({ x: -30, y: 30, width: 80, height: 30 });
  assert.ok(top.y >= viewport.safeAreaTop);
  assert.ok(top.x >= viewport.horizontalMargin);
  assert.ok(top.x + top.width <= viewport.width - viewport.horizontalMargin);

  const bottom = placement({ x: 300, y: 730, width: 80, height: 20 });
  assert.ok(bottom.y + bottom.height <= viewport.height - viewport.safeAreaBottom);
  assert.ok(bottom.x + bottom.width <= viewport.width - viewport.horizontalMargin);
});

test('não intersecta o alvo expandido pelo gap quando existe solução', () => {
  for (const target of [
    { x: 20, y: 80, width: 320, height: 100 },
    { x: 20, y: 350, width: 320, height: 60 },
    { x: 20, y: 650, width: 320, height: 60 },
  ]) {
    const result = placement(target, { width: 300, height: 180 });
    assert.equal(
      rectanglesIntersect(result, expandRect(target, TOUR_TARGET_GAP)),
      false,
    );
  }
});

test('considera gap de segurança configurável', () => {
  const target = { x: 20, y: 100, width: 320, height: 80 };
  const result = calculateTourPanelPlacement(target, panel, viewport, 12);
  assert.equal(result.y, target.y + target.height + 12);
});

test('painel alto usa espaço disponível e solicita rolagem', () => {
  const result = placement(
    { x: 20, y: 350, width: 320, height: 100 },
    { width: 328, height: 900 },
  );
  assert.equal(result.needsScroll, true);
  assert.ok(result.height < 900);
  assert.ok(result.height > 0);
});

test('funciona perto do topo e do rodapé', () => {
  assert.equal(
    placement({ x: 20, y: 25, width: 320, height: 50 }).side,
    'below',
  );
  assert.equal(
    placement({ x: 20, y: 725, width: 320, height: 50 }).side,
    'above',
  );
});

test('alvo fora ou parcialmente fora da janela sempre solicita nova rolagem', () => {
  const below = placement({ x: 20, y: 820, width: 320, height: 60 });
  const partiallyBelow = placement({
    x: 20,
    y: 750,
    width: 320,
    height: 60,
  });
  const above = placement({ x: 20, y: -70, width: 320, height: 60 });

  assert.equal(below.needsScroll, true);
  assert.ok(below.scrollDelta > 0);
  assert.equal(partiallyBelow.needsScroll, true);
  assert.equal(above.needsScroll, true);
  assert.ok(above.scrollDelta < 0);
});

test('funciona em tela pequena e com painel de fonte aumentada', () => {
  const result = placement(
    { x: 16, y: 250, width: 288, height: 64 },
    { width: 500, height: 430 },
    {
      width: 320,
      height: 568,
      safeAreaTop: 24,
      safeAreaBottom: 24,
      horizontalMargin: 16,
    },
  );
  assert.equal(result.width, 288);
  assert.ok(result.height <= 430);
  assert.ok(result.y >= 24);
  assert.ok(result.y + result.height <= 544);
});

test('cálculo é determinístico e não conhece passos do tour', async () => {
  const target = { x: 20, y: 500, width: 320, height: 60 };
  assert.deepEqual(placement(target), placement(target));
  const source = await readFile(
    new URL('../src/features/tutorial/tour-positioning.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /limite|registrar|historico|detalhes/);
});

test('passo Detalhes não força painel abaixo', async () => {
  const source = await readFile(
    new URL('../src/features/tutorial/components/HomeTour.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /detalhes[\s\S]{0,100}(below|abaixo)/);
  assert.match(source, /placement\.needsScroll \|\| !collisionFree/);
  assert.match(source, /key=\{`panel-measurement-\$\{step\}/);
});
