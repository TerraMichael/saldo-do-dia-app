import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

import { APP_IDENTITY } from '../src/shared/app-identity';
import {
  createAppReleaseInfo,
} from '../src/shared/app-version';

async function readJson(path: string) {
  return JSON.parse(
    await readFile(new URL(path, import.meta.url), 'utf8'),
  ) as Record<string, unknown>;
}

async function readSource(path: string) {
  return readFile(new URL(path, import.meta.url), 'utf8');
}

test('versão pública 1.0.0 está sincronizada entre Expo e package.json', async () => {
  const [app, packageJson] = await Promise.all([
    readJson('../app.json'),
    readJson('../package.json'),
  ]);
  const expo = app.expo as Record<string, unknown>;

  assert.equal(expo.version, '1.0.0');
  assert.equal(packageJson.version, '1.0.0');
  assert.equal(expo.version, packageJson.version);
  assert.match(expo.version as string, /^\d+\.\d+\.\d+$/);
});

test('release Android inicial é inteiro positivo e package permanece estável', async () => {
  const app = await readJson('../app.json');
  const expo = app.expo as Record<string, unknown>;
  const android = expo.android as Record<string, unknown>;

  assert.equal(android.versionCode, 1);
  assert.equal(Number.isInteger(android.versionCode), true);
  assert.ok((android.versionCode as number) > 0);
  assert.equal(android.package, 'com.terramichael.saldododia');
});

test('configurações nativas críticas permanecem presentes', async () => {
  const app = await readJson('../app.json');
  const expo = app.expo as Record<string, any>;

  assert.equal(expo.name, 'Saldo do Dia');
  assert.equal(expo.slug, 'saldo-do-dia-app');
  assert.equal(expo.scheme, 'saldododia');
  assert.equal(expo.orientation, 'portrait');
  assert.equal(expo.userInterfaceStyle, 'automatic');
  assert.equal(expo.newArchEnabled, true);
  assert.equal(expo.experiments.typedRoutes, true);
  assert.equal(expo.extra.defaultLocale, 'pt-BR');
  assert.ok(expo.icon);
  assert.ok(expo.android.adaptiveIcon.foregroundImage);
  assert.ok(expo.android.adaptiveIcon.monochromeImage);
  assert.ok(expo.plugins.includes('expo-router'));
  assert.ok(
    expo.plugins.some(
      (plugin: unknown) =>
        Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    ),
  );
});

test('identidade centralizada usa somente produto e marca aprovados', () => {
  assert.deepEqual(APP_IDENTITY, {
    productName: 'Saldo do Dia',
    publisherName: 'Leahcim',
  });
  assert.equal(
    `Powered by ${APP_IDENTITY.publisherName}`,
    'Powered by Leahcim',
  );
});

test('helper retorna metadados configurados e label acessível completa', () => {
  const info = createAppReleaseInfo({
    version: '1.0.0',
    android: { versionCode: 1 },
  });

  assert.deepEqual(info, {
    version: '1.0.0',
    release: '1',
    productName: 'Saldo do Dia',
    publisherName: 'Leahcim',
    accessibilityLabel:
      'Saldo do Dia. Versão 1.0.0. Release 1. Powered by Leahcim.',
  });
});

test('helper possui fallbacks seguros sem expoConfig', () => {
  for (const config of [
    undefined,
    null,
    {},
    { version: '', android: {} },
    { version: 100, android: { versionCode: '1' } },
  ]) {
    const info = createAppReleaseInfo(config);
    assert.equal(info.version, 'Não informada');
    assert.equal(info.release, 'Não informada');
    assert.match(info.accessibilityLabel, /Não informada/);
  }
});

test('adaptador runtime usa expo-constants e delega ao helper seguro', async () => {
  const adapter = await readSource('../src/shared/app-release.ts');
  assert.match(adapter, /from 'expo-constants'/);
  assert.match(adapter, /createAppReleaseInfo\(Constants\.expoConfig\)/);
  assert.doesNotMatch(adapter, /package\.json|app\.json|AsyncStorage/);
});

test('seção Sobre vem depois de Ajuda e usa componente não interativo', async () => {
  const [settings, about] = await Promise.all([
    readSource('../src/features/settings/components/SettingsScreen.tsx'),
    readSource('../src/features/settings/components/AboutSection.tsx'),
  ]);

  assert.ok(settings.indexOf('Ajuda') < settings.indexOf('<AboutSection />'));
  assert.match(about, />\s*Sobre\s*</);
  assert.match(about, /Versão \{release\.version\}/);
  assert.match(about, /Release \{release\.release\}/);
  assert.match(about, /Powered by \{release\.publisherName\}/);
  assert.match(about, /accessibilityLabel=\{release\.accessibilityLabel\}/);
  assert.doesNotMatch(about, /Pressable|Chevron|chevron|router|onPress/);
  assert.doesNotMatch(about, /accessibilityRole="button"|accessibilityHint/);
});

test('Settings usa identidade centralizada sem repetir produto ou publisher', async () => {
  const settings = await readSource(
    '../src/features/settings/components/SettingsScreen.tsx',
  );
  assert.match(settings, /APP_IDENTITY\.productName/);
  assert.doesNotMatch(settings, /'Saldo do Dia'|'Leahcim'/);
});

test('não cria rota Sobre nem persistência para identidade ou versão', async () => {
  const routes = await readdir(new URL('../app/', import.meta.url), {
    recursive: true,
  });
  const sources = await Promise.all([
    readSource('../src/shared/app-identity.ts'),
    readSource('../src/shared/app-version.ts'),
    readSource('../src/shared/app-release.ts'),
    readSource('../src/features/settings/components/AboutSection.tsx'),
  ]);

  assert.equal(
    routes.some((route) => /sobre/i.test(String(route))),
    false,
  );
  for (const source of sources) {
    assert.doesNotMatch(source, /AsyncStorage|@saldo-do-dia\//);
  }
});

test('não declara entidade jurídica ou marca registrada inexistente', async () => {
  const sources = (
    await Promise.all([
      readSource('../src/shared/app-identity.ts'),
      readSource('../src/features/settings/components/AboutSection.tsx'),
      readSource('../README.md'),
      readSource('../CONTEXTO_CODEX.md'),
    ])
  ).join('\n');

  assert.doesNotMatch(
    sources,
    /Leahcim\s+(Ltda\.?|Inc\.?|Corporation)|CNPJ|razão social|[®™]/i,
  );
});

test('persistência financeira permanece v3 e nenhuma chave nova é criada', async () => {
  const serialization = await readSource('../src/storage/serialization.ts');
  assert.match(serialization, /VERSAO_PLANEJAMENTO_PERSISTIDO = 3/);
  assert.doesNotMatch(serialization, /APP_IDENTITY|AppReleaseInfo|Leahcim/);
});
