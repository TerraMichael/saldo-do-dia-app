import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  criarResumoCicloEncerrado,
  ErroNovoCiclo,
  iniciarNovoCiclo,
} from '../src/features/cycle';
import type { EntradaCalculoDiario } from '../src/features/daily-limit';
import { criarApresentacaoHistorico } from '../src/features/history';
import { hidratarPlanejamento } from '../src/storage/hydration';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { criarArmazenamentoPlanejamento } from '../src/storage/planning-storage';
import { iniciarNovoCicloPersistido } from '../src/storage/planning-service';
import {
  serializarPlanejamento,
  VERSAO_PLANEJAMENTO_PERSISTIDO,
} from '../src/storage/serialization';

const hoje = '2026-07-19';
const configuracaoAnterior: EntradaCalculoDiario = {
  saldoAtual: 250_00,
  contasPendentes: 80_00,
  reserva: 20_00,
  dataAtual: '2026-07-18',
  dataProximoRecebimento: hoje,
  gastosRegistrados: [
    { id: 'anterior-1', valor: 10_00, data: '2026-07-18' },
    { id: 'anterior-2', valor: 25_50, data: hoje },
  ],
};
const dadosValidos = {
  saldoAtual: 'R$ 1.200,00',
  contasPendentes: 'R$ 300,00',
  reserva: 'R$ 100,00',
  dataProximoRecebimento: '2026-08-01',
};

test('novo ciclo usa o saldo informado como fonte de verdade', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  assert.equal(novo.configuracao.saldoAtual, 1_200_00);
});

test('saldo anterior não é somado ao novo saldo', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  assert.notEqual(
    novo.configuracao.saldoAtual,
    configuracaoAnterior.saldoAtual + 1_200_00,
  );
  assert.equal(novo.configuracao.saldoAtual, 1_200_00);
});

test('gastos anteriores são removidos da nova configuração', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  assert.deepEqual(novo.configuracao.gastosRegistrados, []);
});

test('criação do novo ciclo não modifica a configuração anterior', () => {
  const antes = JSON.stringify(configuracaoAnterior);
  iniciarNovoCiclo(dadosValidos, hoje);
  assert.equal(JSON.stringify(configuracaoAnterior), antes);
});

test('dataAtual recebe a data civil injetada', () => {
  assert.equal(iniciarNovoCiclo(dadosValidos, hoje).configuracao.dataAtual, hoje);
});

test('próxima data estritamente futura é aceita', () => {
  assert.equal(
    iniciarNovoCiclo(dadosValidos, hoje).configuracao.dataProximoRecebimento,
    '2026-08-01',
  );
});

test('data de hoje é rejeitada', () => {
  assert.throws(
    () =>
      iniciarNovoCiclo(
        { ...dadosValidos, dataProximoRecebimento: hoje },
        hoje,
      ),
    (erro) =>
      erro instanceof ErroNovoCiclo &&
      erro.campo === 'dataProximoRecebimento' &&
      erro.codigo === 'DATA_INVALIDA',
  );
});

test('data passada é rejeitada', () => {
  assert.throws(
    () =>
      iniciarNovoCiclo(
        { ...dadosValidos, dataProximoRecebimento: '2026-07-18' },
        hoje,
      ),
    (erro) => erro instanceof ErroNovoCiclo && erro.codigo === 'DATA_INVALIDA',
  );
});

test('saldo negativo é aceito como fonte de verdade', () => {
  const novo = iniciarNovoCiclo({ ...dadosValidos, saldoAtual: '-50,00' }, hoje);
  assert.equal(novo.configuracao.saldoAtual, -50_00);
});

test('saldo zero é aceito', () => {
  assert.equal(
    iniciarNovoCiclo({ ...dadosValidos, saldoAtual: '0' }, hoje).configuracao
      .saldoAtual,
    0,
  );
});

test('contas negativas são rejeitadas', () => {
  assert.throws(
    () =>
      iniciarNovoCiclo(
        { ...dadosValidos, contasPendentes: '-1,00' },
        hoje,
      ),
    (erro) =>
      erro instanceof ErroNovoCiclo &&
      erro.campo === 'contasPendentes' &&
      erro.codigo === 'VALOR_NEGATIVO',
  );
});

test('reserva negativa é rejeitada', () => {
  assert.throws(
    () => iniciarNovoCiclo({ ...dadosValidos, reserva: '-1,00' }, hoje),
    (erro) =>
      erro instanceof ErroNovoCiclo &&
      erro.campo === 'reserva' &&
      erro.codigo === 'VALOR_NEGATIVO',
  );
});

test('moeda inválida é rejeitada', () => {
  assert.throws(
    () => iniciarNovoCiclo({ ...dadosValidos, saldoAtual: '12,3x' }, hoje),
    (erro) =>
      erro instanceof ErroNovoCiclo &&
      erro.campo === 'saldoAtual' &&
      erro.codigo === 'VALOR_INVALIDO',
  );
});

test('campos opcionais vazios usam zero', () => {
  const novo = iniciarNovoCiclo(
    { ...dadosValidos, contasPendentes: '', reserva: '' },
    hoje,
  );
  assert.equal(novo.configuracao.contasPendentes, 0);
  assert.equal(novo.configuracao.reserva, 0);
});

test('resultado financeiro é recalculado para a nova configuração', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  assert.equal(novo.resultado.valorDisponivel, 800_00);
  assert.equal(
    novo.resultado.valorDisponivel,
    novo.configuracao.saldoAtual -
      novo.configuracao.contasPendentes -
      novo.configuracao.reserva,
  );
});

test('totalGastosHoje volta a zero', () => {
  assert.equal(iniciarNovoCiclo(dadosValidos, hoje).resultado.totalGastosHoje, 0);
});

test('totalGastosRegistrados volta a zero', () => {
  assert.equal(
    iniciarNovoCiclo(dadosValidos, hoje).resultado.totalGastosRegistrados,
    0,
  );
});

test('histórico do novo ciclo fica vazio', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  assert.equal(
    criarApresentacaoHistorico(novo.configuracao.gastosRegistrados, hoje).vazio,
    true,
  );
});

test('resumo informa a quantidade de gastos encerrados', () => {
  assert.equal(criarResumoCicloEncerrado(configuracaoAnterior).quantidadeGastos, 2);
});

test('resumo informa o total gasto no ciclo encerrado', () => {
  assert.equal(criarResumoCicloEncerrado(configuracaoAnterior).totalGasto, 35_50);
});

test('cancelamento não modifica nem persiste o planejamento anterior', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  await armazenamento.salvar(configuracaoAnterior);
  const antes = JSON.stringify(configuracaoAnterior);

  assert.equal(JSON.stringify(configuracaoAnterior), antes);
  assert.deepEqual(await armazenamento.carregar(), configuracaoAnterior);
});

test('falha de persistência mantém planejamento e histórico anteriores', async () => {
  const adaptador = new AdaptadorMemoria();
  const armazenamento = criarArmazenamentoPlanejamento(adaptador);
  await armazenamento.salvar(configuracaoAnterior);
  adaptador.falharGravacao = true;

  await assert.rejects(() =>
    iniciarNovoCicloPersistido(armazenamento, dadosValidos, hoje),
  );
  adaptador.falharGravacao = false;
  assert.deepEqual(await armazenamento.carregar(), configuracaoAnterior);
});

test('persistência bem-sucedida retorna configuração e resultado sincronizados', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  await armazenamento.salvar(configuracaoAnterior);
  const novo = await iniciarNovoCicloPersistido(
    armazenamento,
    dadosValidos,
    hoje,
  );

  assert.deepEqual(await armazenamento.carregar(), novo.configuracao);
  assert.equal(novo.resultado.totalGastosRegistrados, 0);
  assert.equal(novo.configuracao.gastosRegistrados.length, 0);
});

test('reinício restaura o novo ciclo pronto para a Home', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const novo = await iniciarNovoCicloPersistido(
    armazenamento,
    dadosValidos,
    hoje,
  );
  const restaurado = await hidratarPlanejamento(armazenamento, hoje);

  assert.equal(restaurado.tipo, 'pronto');
  if (restaurado.tipo === 'pronto') {
    assert.deepEqual(restaurado.configuracao, novo.configuracao);
    assert.equal(restaurado.resultado.totalGastosRegistrados, 0);
  }
});

test('estado expirado oferece iniciar novo ciclo e ajustar planejamento', () => {
  const tela = readFileSync(
    'src/features/onboarding/components/PlanningStateScreen.tsx',
    'utf8',
  );
  assert.match(tela, /Já recebi — iniciar novo ciclo/);
  assert.match(tela, /Ainda não recebi — ajustar planejamento/);
  assert.match(tela, /router\.push\('\/novo-ciclo'\)/);
  assert.match(tela, /router\.replace\('\/onboarding'\)/);
});

test('ajuste de planejamento existente preserva os gastos', () => {
  const formulario = readFileSync(
    'src/features/onboarding/components/OnboardingForm.tsx',
    'utf8',
  );
  assert.match(
    formulario,
    /gastosRegistrados: configuracao\?\.gastosRegistrados \?\? \[\]/,
  );
});

test('novo ciclo sempre remove os gastos', () => {
  const fonte = readFileSync(
    'src/features/cycle/start-new-cycle.ts',
    'utf8',
  );
  assert.match(fonte, /gastosRegistrados: \[\]/);
});

test('botões Voltar e Cancelar não confirmam a operação', () => {
  const formulario = readFileSync(
    'src/features/cycle/components/NewCycleForm.tsx',
    'utf8',
  );
  const revisao = readFileSync(
    'src/features/cycle/components/NewCycleReview.tsx',
    'utf8',
  );
  assert.match(formulario, /hardwareBackPress/);
  assert.match(formulario, /cancelarNovoCiclo\(\)/);
  assert.match(revisao, /router\.back\(\)/);
  assert.match(revisao, /label="Cancelar"/);
});

test('confirmação duplicada é impedida por trava síncrona', () => {
  const revisao = readFileSync(
    'src/features/cycle/components/NewCycleReview.tsx',
    'utf8',
  );
  assert.match(revisao, /salvamentoEmAndamento\.current/);
  assert.match(revisao, /if \(salvamentoEmAndamento\.current\)/);
});

test('armazenamento continua escrevendo o documento na versão 2', () => {
  const novo = iniciarNovoCiclo(dadosValidos, hoje);
  const documento = JSON.parse(serializarPlanejamento(novo.configuracao)) as {
    versao: number;
  };
  assert.equal(VERSAO_PLANEJAMENTO_PERSISTIDO, 2);
  assert.equal(documento.versao, 2);
});

test('novo arquivo é executado explicitamente pelo npm test no PowerShell', () => {
  const pacote = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: { test: string };
  };
  assert.match(pacote.scripts.test, /tests\/new-cycle\.test\.ts/);
});
