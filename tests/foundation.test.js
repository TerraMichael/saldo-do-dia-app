const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const appConfig = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const home = readFileSync('app/index.tsx', 'utf8');
const onboardingForm = readFileSync(
  'src/features/onboarding/components/OnboardingForm.tsx',
  'utf8',
);
const expenseForm = readFileSync(
  'src/features/expenses/components/ExpenseForm.tsx',
  'utf8',
);

test('configura a identidade e o alvo Android do aplicativo', () => {
  assert.equal(appConfig.name, 'Saldo do Dia');
  assert.equal(appConfig.slug, 'saldo-do-dia-app');
  assert.equal(appConfig.orientation, 'portrait');
  assert.equal(appConfig.android.package, 'com.terramichael.saldododia');
  assert.equal(appConfig.extra.defaultLocale, 'pt-BR');
});

test('a rota inicial resolve apresentação, planejamento e Home sem tela redundante', () => {
  assert.match(home, /resolverDestinoInicial/);
  assert.match(home, /<Redirect href=\{destino\}/);
  assert.doesNotMatch(home, /Descubra quanto você pode gastar hoje/);
});

test('campos monetários não selecionam automaticamente o primeiro valor digitado', () => {
  assert.doesNotMatch(onboardingForm, /selectTextOnFocus/);
  assert.doesNotMatch(expenseForm, /selectTextOnFocus/);
});
