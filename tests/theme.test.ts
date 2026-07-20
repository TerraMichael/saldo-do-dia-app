import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  darkColors,
  lightColors,
  type AppColors,
} from '../src/ui/theme/colors';
import { criarAppTheme } from '../src/ui/theme/create-theme';

const CHAVES: readonly (keyof AppColors)[] = [
  'background',
  'surface',
  'surfaceMuted',
  'primary',
  'primaryDark',
  'primarySoft',
  'primaryBorder',
  'positiveBadge',
  'text',
  'textSecondary',
  'textMuted',
  'placeholder',
  'border',
  'borderStrong',
  'divider',
  'success',
  'successSoft',
  'warning',
  'warningText',
  'warningSoft',
  'warningBorder',
  'warningBadge',
  'error',
  'errorStrong',
  'errorSoft',
  'errorBorder',
  'disabled',
  'white',
];

async function ler(caminho: string) {
  return readFile(new URL(caminho, import.meta.url), 'utf8');
}

test('paletas possuem as mesmas chaves e somente cores hexadecimais válidas', () => {
  assert.deepEqual(Object.keys(lightColors).sort(), [...CHAVES].sort());
  assert.deepEqual(Object.keys(darkColors).sort(), [...CHAVES].sort());

  for (const colors of [lightColors, darkColors]) {
    for (const chave of CHAVES) {
      assert.match(colors[chave], /^#[0-9A-F]{6}$/i, chave);
    }
  }
});

test('paletas preservam fundos e contraste estrutural aprovado', () => {
  assert.equal(lightColors.background, '#F4F8F5');
  assert.equal(darkColors.background, '#0D1511');

  for (const colors of [lightColors, darkColors]) {
    assert.notEqual(colors.primary, colors.background);
    assert.notEqual(colors.text, colors.background);
    assert.notEqual(colors.textSecondary, colors.background);
  }
});

test('seleção pura escolhe claro, escuro e fallback claro', () => {
  assert.equal(criarAppTheme('light').colors, lightColors);
  assert.equal(criarAppTheme('dark').colors, darkColors);
  assert.equal(criarAppTheme(null).colorScheme, 'light');
  assert.equal(criarAppTheme(undefined).colorScheme, 'light');
  assert.equal(criarAppTheme('inesperado').colorScheme, 'light');
});

test('StatusBar usa ícones escuros no claro e claros no escuro', () => {
  assert.equal(criarAppTheme('light').statusBarStyle, 'dark');
  assert.equal(criarAppTheme('dark').statusBarStyle, 'light');
});

test('app.json ativa aparência automática, expo-system-ui e splash dupla', async () => {
  const [configSource, packageSource] = await Promise.all([
    ler('../app.json'),
    ler('../package.json'),
  ]);
  const { expo } = JSON.parse(configSource);
  const packageJson = JSON.parse(packageSource);
  const splash = expo.plugins.find(
    (plugin: unknown) =>
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );

  assert.equal(expo.userInterfaceStyle, 'automatic');
  assert.ok(packageJson.dependencies['expo-system-ui']);
  assert.equal(splash[1].backgroundColor, '#F4F8F5');
  assert.equal(splash[1].image, './assets/brand/splash-icon.png');
  assert.equal(splash[1].dark.backgroundColor, '#0D1511');
  assert.equal(splash[1].dark.image, './assets/brand/splash-icon.png');
  assert.equal(splash[1].imageWidth, 160);
  assert.equal(splash[1].resizeMode, 'contain');
});

test('configurações funcionais anteriores permanecem intactas', async () => {
  const { expo } = JSON.parse(await ler('../app.json'));
  const localization = expo.plugins.find(
    (plugin: unknown) =>
      Array.isArray(plugin) && plugin[0] === 'expo-localization',
  );

  assert.equal(expo.orientation, 'portrait');
  assert.equal(expo.scheme, 'saldododia');
  assert.equal(expo.android.package, 'com.terramichael.saldododia');
  assert.equal(expo.newArchEnabled, true);
  assert.equal(expo.experiments.typedRoutes, true);
  assert.deepEqual(localization[1].supportedLocales.android, ['pt-BR']);
  assert.ok(expo.plugins.includes('expo-router'));
  assert.ok(expo.plugins.includes('@react-native-community/datetimepicker'));
  assert.ok(expo.plugins.includes('expo-font'));
});

test('provider envolve estado financeiro e navegador permanece sempre montado', async () => {
  const root = await ler('../app/_layout.tsx');
  const themeProvider = root.indexOf('<AppThemeProvider>');
  const onboardingProvider = root.indexOf('<OnboardingProvider>');
  const stack = root.indexOf('<Stack');

  assert.ok(themeProvider >= 0 && onboardingProvider > themeProvider);
  assert.ok(stack >= 0);
  assert.doesNotMatch(root, /hydrationReady\s*\?\s*\(\s*<Stack/);
  assert.match(root, /useAppTheme\(\)/);
  assert.match(root, /style=\{statusBarStyle\}/);
  assert.match(root, /SystemUI\.setBackgroundColorAsync\(colors\.background\)/);
});

test('hook declara erro claro fora do provider', async () => {
  const provider = await ler('../src/ui/theme/ThemeProvider.tsx');
  assert.match(
    provider,
    /useAppTheme deve ser usado dentro de AppThemeProvider/,
  );
});

test('AppScreen e loading usam fundo e cores do tema ativo', async () => {
  const [screen, loading] = await Promise.all([
    ler('../src/ui/components/AppScreen.tsx'),
    ler('../src/ui/components/LaunchLoadingScreen.tsx'),
  ]);

  for (const source of [screen, loading]) {
    assert.match(source, /useAppTheme\(\)/);
    assert.match(source, /criarEstilos\(colors\)/);
  }
  assert.match(screen, /backgroundColor: colors\.background/);
  assert.match(loading, /color=\{colors\.primary\}/);
});

test('componentes principais usam cores dinâmicas sem paleta clara global', async () => {
  const arquivos = [
    'AppButton.tsx',
    'AppCard.tsx',
    'AppHeader.tsx',
    'AppStateView.tsx',
    'AppTextField.tsx',
    'CollapsibleSection.tsx',
    'InfoRow.tsx',
    'InlineFeedback.tsx',
    'MoneyInput.tsx',
    'SectionTitle.tsx',
  ];

  for (const arquivo of arquivos) {
    const source = await ler(`../src/ui/components/${arquivo}`);
    assert.match(source, /useAppTheme\(\)/, arquivo);
    assert.doesNotMatch(source, /import\s*\{\s*colors[,}]/, arquivo);
  }
});

test('inputs usam placeholder, seleção e estilos derivados do tema', async () => {
  for (const arquivo of ['MoneyInput.tsx', 'AppTextField.tsx']) {
    const source = await ler(`../src/ui/components/${arquivo}`);
    assert.match(source, /placeholderTextColor=\{colors\.placeholder\}/);
    assert.match(source, /selectionColor=\{colors\.primary\}/);
    assert.match(source, /backgroundColor: colors\.surface/);
  }
});

test('feedbacks, cards, botões e seção recolhível usam cores semânticas dinâmicas', async () => {
  const [card, button, feedback, collapsible] = await Promise.all([
    ler('../src/ui/components/AppCard.tsx'),
    ler('../src/ui/components/AppButton.tsx'),
    ler('../src/ui/components/InlineFeedback.tsx'),
    ler('../src/ui/components/CollapsibleSection.tsx'),
  ]);

  assert.match(card, /colors\.warningSoft/);
  assert.match(card, /colors\.errorSoft/);
  assert.match(button, /colors\.primary/);
  assert.match(button, /colors\.error/);
  assert.match(feedback, /colors\.warningText/);
  assert.match(feedback, /colors\.errorStrong/);
  assert.match(collapsible, /colors\.surfaceMuted/);
});

test('persistência e regras financeiras não recebem dependência de tema', async () => {
  const [storage, domain] = await Promise.all([
    ler('../src/storage/serialization.ts'),
    ler('../src/features/daily-limit/index.ts'),
  ]);

  assert.doesNotMatch(storage, /AppTheme|useColorScheme|modo-escuro/);
  assert.doesNotMatch(domain, /AppTheme|useColorScheme|modo-escuro/);
  assert.match(storage, /VERSAO_PLANEJAMENTO_PERSISTIDO = 3/);
});
