import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import {
  carregarAparenciaComFallback,
  CHAVE_APARENCIA,
  criarArmazenamentoAparencia,
} from '../src/storage/appearance-storage';
import { CHAVE_PLANEJAMENTO } from '../src/storage/planning-storage';
import {
  PREFERENCIA_APARENCIA_PADRAO,
  resolverEsquemaAparencia,
} from '../src/ui/theme/appearance';

async function ler(caminho: string) {
  return readFile(new URL(caminho, import.meta.url), 'utf8');
}

test('instalação nova usa sistema como preferência padrão', async () => {
  const storage = criarArmazenamentoAparencia(new AdaptadorMemoria());
  assert.equal(await storage.carregar(), 'sistema');
  assert.equal(PREFERENCIA_APARENCIA_PADRAO, 'sistema');
});

test('preferências claro e escuro forçam seus esquemas', () => {
  assert.equal(resolverEsquemaAparencia('claro', 'dark'), 'light');
  assert.equal(resolverEsquemaAparencia('escuro', 'light'), 'dark');
});

test('preferência sistema acompanha o esquema atual e tem fallback claro', () => {
  assert.equal(resolverEsquemaAparencia('sistema', 'light'), 'light');
  assert.equal(resolverEsquemaAparencia('sistema', 'dark'), 'dark');
  assert.equal(resolverEsquemaAparencia('sistema', null), 'light');
  assert.equal(resolverEsquemaAparencia('sistema', 'inesperado'), 'light');
});

test('preferência manual ignora mudanças do esquema do sistema', () => {
  assert.equal(resolverEsquemaAparencia('claro', 'light'), 'light');
  assert.equal(resolverEsquemaAparencia('claro', 'dark'), 'light');
  assert.equal(resolverEsquemaAparencia('escuro', 'light'), 'dark');
  assert.equal(resolverEsquemaAparencia('escuro', 'dark'), 'dark');
});

test('voltar para sistema usa imediatamente o esquema atual', () => {
  assert.equal(resolverEsquemaAparencia('claro', 'dark'), 'light');
  assert.equal(resolverEsquemaAparencia('sistema', 'dark'), 'dark');
});

test('preferência é persistida e restaurada na chave independente', async () => {
  const adapter = new AdaptadorMemoria();
  const storage = criarArmazenamentoAparencia(adapter);

  await storage.salvar('escuro');

  assert.equal(await adapter.obter(CHAVE_APARENCIA), '"escuro"');
  assert.equal(await storage.carregar(), 'escuro');
  assert.equal(CHAVE_APARENCIA, '@saldo-do-dia/aparencia:v1');
});

test('valor persistido desconhecido ou inválido usa sistema', async () => {
  for (const value of ['"azul"', '{inválido', '42']) {
    const storage = criarArmazenamentoAparencia(
      new AdaptadorMemoria({ [CHAVE_APARENCIA]: value }),
    );
    assert.equal(await storage.carregar(), 'sistema');
  }
});

test('falha de leitura usa sistema e conclui a operação de fallback', async () => {
  const adapter = new AdaptadorMemoria();
  adapter.falharLeitura = true;
  const storage = criarArmazenamentoAparencia(adapter);

  assert.equal(await carregarAparenciaComFallback(storage), 'sistema');
});

test('falha de gravação visual não modifica dados financeiros', async () => {
  const financialDocument = '{"versao":3,"dados":"preservados"}';
  const adapter = new AdaptadorMemoria({
    [CHAVE_PLANEJAMENTO]: financialDocument,
  });
  adapter.falharGravacao = true;
  const storage = criarArmazenamentoAparencia(adapter);

  await assert.rejects(() => storage.salvar('escuro'));
  adapter.falharGravacao = false;

  assert.equal(await adapter.obter(CHAVE_PLANEJAMENTO), financialDocument);
  assert.equal(await adapter.obter(CHAVE_APARENCIA), null);
});

test('provider aplica preferência na sessão antes de tentar persistir', async () => {
  const provider = await ler('../src/ui/theme/ThemeProvider.tsx');
  const update = provider.indexOf('setPreferenceState(nextPreference)');
  const save = provider.indexOf(
    'armazenamentoAparencia.salvar(nextPreference)',
  );

  assert.ok(update >= 0 && save > update);
});

test('themeReady participa da liberação da splash e falha não a prende', async () => {
  const [root, provider, controller] = await Promise.all([
    ler('../app/_layout.tsx'),
    ler('../src/ui/theme/ThemeProvider.tsx'),
    ler('../src/ui/components/LaunchSplashController.tsx'),
  ]);

  assert.match(root, /planningReady && themeReady/);
  assert.match(provider, /carregarAparenciaComFallback/);
  assert.match(provider, /\.finally\(\(\) => \{/);
  assert.match(provider, /setThemeReady\(true\)/);
  assert.match(controller, /initialScreenReady\.current = true/);
  assert.match(
    controller,
    /hydrationReady && initialScreenReady\.current/,
  );
});

test('tela de configurações indica seleção por texto, ícone e estado acessível', async () => {
  const screen = await ler(
    '../src/features/settings/components/SettingsScreen.tsx',
  );

  assert.match(screen, /Usar tema do aparelho/);
  assert.match(screen, /Claro/);
  assert.match(screen, /Escuro/);
  assert.match(screen, /accessibilityRole="radio"/);
  assert.match(screen, /checked: selected/);
  assert.match(screen, /selected \? 'Selecionado' : 'Selecionar'/);
  assert.match(screen, /check-circle/);
});

test('Home abre configurações por ação acessível do cabeçalho', async () => {
  const home = await ler(
    '../src/features/home/components/HomeScreen.tsx',
  );

  assert.match(home, /accessibilityLabel: 'Abrir configurações'/);
  assert.match(home, /router\.push\('\/configuracoes'\)/);
  assert.match(home, /icon: 'cog-outline'/);
});

test('aparência não entra na persistência financeira v3', async () => {
  const [serialization, planningStorage] = await Promise.all([
    ler('../src/storage/serialization.ts'),
    ler('../src/storage/planning-storage.ts'),
  ]);

  assert.match(serialization, /VERSAO_PLANEJAMENTO_PERSISTIDO = 3/);
  assert.doesNotMatch(serialization, /PreferenciaAparencia|CHAVE_APARENCIA/);
  assert.doesNotMatch(planningStorage, /PreferenciaAparencia|CHAVE_APARENCIA/);
});
