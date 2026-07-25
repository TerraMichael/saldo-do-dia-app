import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function sources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await sources(target));
    else if (/\.(ts|tsx|js|json)$/.test(entry.name)) result.push(target);
  }
  return result;
}

test('Android desativa backup e bloqueia permissões desnecessárias', async () => {
  const { expo } = JSON.parse(await readFile('app.json', 'utf8'));
  assert.equal(expo.android.allowBackup, false);
  assert.deepEqual(
    new Set(expo.android.blockedPermissions),
    new Set([
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
    ]),
  );
});

test('aplicativo não implementa chamadas de rede ou SDKs de rastreamento', async () => {
  const files = [...await sources('app'), ...await sources('src')];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(
      content,
      /\bfetch\s*\(|XMLHttpRequest|WebSocket|axios|analytics|telemetry|crashlytics|admob/i,
      file,
    );
  }
});

test('logs de produção não expõem payload financeiro', async () => {
  const files = [...await sources('app'), ...await sources('src')];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const logs = content.match(/console\.(?:log|warn|error)\([^)]*\)/g) ?? [];
    for (const log of logs) {
      assert.doesNotMatch(
        log,
        /saldo|reserva|contas|gasto|descricao|configuracao|documento|payload/i,
        `${file}: ${log}`,
      );
    }
  }
});

test('gitignore protege segredos e artefatos de cobertura', async () => {
  const ignore = await readFile('.gitignore', 'utf8');
  for (const pattern of [
    '*.jks',
    '*.keystore',
    '*.p12',
    '*.pem',
    '*.key',
    'google-services.json',
    'service-account*.json',
    '.env',
    '.env.*',
    '!.env.example',
    'coverage/',
  ]) {
    assert.match(ignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('release preserva identidade, versão e EAS mínimo somente para preview APK', async () => {
  const source = await readFile('app.json', 'utf8');
  const { expo } = JSON.parse(source);
  const eas = JSON.parse(await readFile('eas.json', 'utf8'));
  assert.equal(expo.version, '1.0.0');
  assert.equal(expo.android.versionCode, 1);
  assert.equal(expo.android.package, 'com.terramichael.saldododia');
  assert.equal(expo.extra.defaultLocale, 'pt-BR');

  const localizationPlugin = expo.plugins.find(
    (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-localization',
  );
  assert.ok(Array.isArray(localizationPlugin));
  assert.deepEqual(localizationPlugin[1].supportedLocales.android, ['pt']);
  assert.equal(expo.experiments.typedRoutes, true);
  assert.equal(expo.owner, 'michaelterra');
  assert.match(expo.extra.eas.projectId, /^[0-9a-f-]{36}$/i);
  assert.equal('runtimeVersion' in expo, false);
  assert.equal('updates' in expo, false);
  assert.deepEqual(Object.keys(eas.build), ['preview']);
  assert.equal(eas.build.preview.distribution, 'internal');
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.equal('autoIncrement' in eas.build.preview, false);
  assert.equal('submit' in eas, false);
});
