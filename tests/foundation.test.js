const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const appConfig = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const home = readFileSync('app/index.tsx', 'utf8');

test('configura a identidade e o alvo Android do aplicativo', () => {
  assert.equal(appConfig.name, 'Saldo do Dia');
  assert.equal(appConfig.slug, 'saldo-do-dia-app');
  assert.equal(appConfig.orientation, 'portrait');
  assert.equal(appConfig.android.package, 'com.terramichael.saldododia');
  assert.equal(appConfig.extra.defaultLocale, 'pt-BR');
});

test('a tela inicial contém a mensagem principal e a ação inicial', () => {
  assert.match(home, /Saldo do Dia/);
  assert.match(home, /Descubra quanto você pode gastar hoje/);
  assert.match(home, /Começar/);
});
