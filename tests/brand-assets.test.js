import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const BRAND_BACKGROUND = '#F4F8F5';
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ASSETS = [
  'brand-mark.png',
  'app-icon.png',
  'adaptive-icon-foreground.png',
  'adaptive-icon-monochrome.png',
  'splash-icon.png',
];

async function readAppConfig() {
  return JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
}

test('assets de marca existem, são PNG válidos e medem 1024x1024', async () => {
  for (const file of ASSETS) {
    const contents = await readFile(
      new URL(`../assets/brand/${file}`, import.meta.url),
    );

    assert.deepEqual(contents.subarray(0, 8), PNG_SIGNATURE, `${file}: assinatura PNG`);
    assert.equal(contents.toString('ascii', 12, 16), 'IHDR', `${file}: bloco IHDR`);
    assert.equal(contents.readUInt32BE(16), 1024, `${file}: largura`);
    assert.equal(contents.readUInt32BE(20), 1024, `${file}: altura`);
  }
});

test('app.json referencia ícone, adaptive icon e monochrome icon entregues', async () => {
  const { expo } = await readAppConfig();

  assert.equal(expo.icon, './assets/brand/app-icon.png');
  assert.equal(
    expo.android.adaptiveIcon.foregroundImage,
    './assets/brand/adaptive-icon-foreground.png',
  );
  assert.equal(
    expo.android.adaptiveIcon.monochromeImage,
    './assets/brand/adaptive-icon-monochrome.png',
  );
});

test('splash usa o plugin e o asset de marca sem alterar sua proporção', async () => {
  const { expo } = await readAppConfig();
  const plugin = expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-splash-screen',
  );

  assert.ok(plugin, 'plugin expo-splash-screen ausente');
  assert.deepEqual(plugin[1], {
    image: './assets/brand/splash-icon.png',
    imageWidth: 160,
    resizeMode: 'contain',
    backgroundColor: BRAND_BACKGROUND,
    dark: {
      image: './assets/brand/splash-icon.png',
      backgroundColor: '#0D1511',
    },
  });
});

test('fundo da configuração nativa, adaptive icon e splash é consistente', async () => {
  const { expo } = await readAppConfig();
  const splashPlugin = expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-splash-screen',
  );

  assert.equal(expo.backgroundColor, BRAND_BACKGROUND);
  assert.equal(expo.android.backgroundColor, BRAND_BACKGROUND);
  assert.equal(expo.android.adaptiveIcon.backgroundColor, BRAND_BACKGROUND);
  assert.equal(splashPlugin[1].backgroundColor, BRAND_BACKGROUND);
});

test('configurações funcionais existentes permanecem declaradas', async () => {
  const { expo } = await readAppConfig();
  const localization = expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-localization',
  );

  assert.ok(expo.plugins.includes('expo-router'));
  assert.ok(expo.plugins.includes('@react-native-community/datetimepicker'));
  assert.deepEqual(localization[1].supportedLocales.android, ['pt-BR']);
  assert.equal(expo.experiments.typedRoutes, true);
  assert.equal(expo.android.package, 'com.terramichael.saldododia');
});
