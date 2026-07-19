import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { DadosPlanejamento } from '../src/features/cycle-history';
import {
  criarApresentacaoDetalheCiclo,
  criarApresentacaoListaCiclos,
  criarDadosPrimeiroCiclo,
} from '../src/features/cycle-history';
import type { EntradaCalculoDiario } from '../src/features/daily-limit';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import { criarArmazenamentoPlanejamento } from '../src/storage/planning-storage';
import {
  confirmarPlanejamentoPersistido,
  editarGastoPersistido,
  excluirGastoPersistido,
  iniciarNovoCicloPersistido,
  registrarGastoPersistido,
} from '../src/storage/planning-service';

const configuracao: EntradaCalculoDiario = {
  saldoAtual: 270_00,
  reserva: 0,
  contasPendentes: 115_00,
  dataAtual: '2026-07-19',
  dataProximoRecebimento: '2026-07-27',
  gastosRegistrados: [
    { id: 'gasto-1', valor: 10_00, data: '2026-07-18' },
    { id: 'gasto-2', valor: 20_00, data: '2026-07-19' },
  ],
};
const dados: DadosPlanejamento = {
  cicloAtual: {
    id: 'atual',
    inicio: {
      dataInicio: '2026-07-01',
      saldoInicial: 300_00,
      reservaInicial: 0,
      contasPendentesIniciais: 115_00,
      dataProximoRecebimentoPrevista: '2026-07-19',
    },
    configuracao,
  },
  ciclosEncerrados: [],
};
const formulario = {
  saldoAtual: 'R$ 1.000,00',
  contasPendentes: 'R$ 200,00',
  reserva: 'R$ 100,00',
  dataProximoRecebimento: '2026-08-01',
};

test('primeiro onboarding cria UUID injetável e resumo inicial', () => {
  const criado = criarDadosPrimeiroCiclo(configuracao, () => 'uuid-ciclo');
  assert.equal(criado.cicloAtual.id, 'uuid-ciclo');
  assert.equal(criado.cicloAtual.inicio?.saldoInicial, configuracao.saldoAtual);
  assert.deepEqual(criado.ciclosEncerrados, []);
});

test('edição do planejamento preserva ID, resumo e encerrados', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const encerrado = { ...dados.cicloAtual, id: 'encerrado', dataEncerramento: '2026-07-18', configuracaoFinal: configuracao };
  const existentes = { ...dados, ciclosEncerrados: [encerrado] };
  const alterada = { ...configuracao, reserva: 5_00 };
  const salvo = await confirmarPlanejamentoPersistido(armazenamento, alterada, existentes, () => 'não-usado');
  assert.equal(salvo.dados.cicloAtual.id, 'atual');
  assert.equal(salvo.dados.cicloAtual.inicio, dados.cicloAtual.inicio);
  assert.equal(salvo.dados.ciclosEncerrados[0], encerrado);
});

test('registro, edição e exclusão preservam ciclos encerrados', async () => {
  const encerrado = { ...dados.cicloAtual, id: 'antigo', dataEncerramento: '2026-07-18', configuracaoFinal: configuracao };
  let estado: DadosPlanejamento = { ...dados, ciclosEncerrados: [encerrado] };
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const registrado = await registrarGastoPersistido(armazenamento, estado, { valor: '5,00' }, '2026-07-19', () => 'gasto-3');
  estado = registrado.dados;
  const editado = await editarGastoPersistido(armazenamento, estado, 'gasto-3', { valor: '6,00' }, '2026-07-19');
  const excluido = await excluirGastoPersistido(armazenamento, editado.dados, 'gasto-3', '2026-07-19');
  assert.equal(registrado.dados.ciclosEncerrados[0], encerrado);
  assert.equal(editado.dados.ciclosEncerrados[0], encerrado);
  assert.equal(excluido.dados.ciclosEncerrados[0], encerrado);
});

test('novo ciclo arquiva configuração final e cria ciclo vazio com UUID diferente', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const novo = await iniciarNovoCicloPersistido(armazenamento, dados, formulario, '2026-07-19', () => 'novo-uuid');
  assert.equal(novo.dados.ciclosEncerrados[0].id, 'atual');
  assert.deepEqual(novo.dados.ciclosEncerrados[0].configuracaoFinal, configuracao);
  assert.equal(novo.dados.cicloAtual.id, 'novo-uuid');
  assert.deepEqual(novo.dados.cicloAtual.configuracao.gastosRegistrados, []);
  assert.equal(novo.dados.cicloAtual.inicio?.saldoInicial, 1000_00);
});

test('ciclo sem gastos também é arquivado e múltiplos ciclos são preservados', async () => {
  const semGastos = { ...dados, cicloAtual: { ...dados.cicloAtual, configuracao: { ...configuracao, gastosRegistrados: [] } } };
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const primeiro = await iniciarNovoCicloPersistido(armazenamento, semGastos, formulario, '2026-07-19', () => 'segundo');
  const segundo = await iniciarNovoCicloPersistido(armazenamento, primeiro.dados, { ...formulario, dataProximoRecebimento: '2026-08-10' }, '2026-08-01', () => 'terceiro');
  assert.equal(segundo.dados.ciclosEncerrados.length, 2);
  assert.equal(segundo.dados.ciclosEncerrados[0].configuracaoFinal.gastosRegistrados.length, 0);
});

test('falha de gravação não publica arquivo nem substitui ciclo ativo', async () => {
  const adaptador = new AdaptadorMemoria();
  const armazenamento = criarArmazenamentoPlanejamento(adaptador);
  await armazenamento.salvar(dados);
  adaptador.falharGravacao = true;
  await assert.rejects(() => iniciarNovoCicloPersistido(armazenamento, dados, formulario, '2026-07-19', () => 'novo'));
  adaptador.falharGravacao = false;
  assert.deepEqual(await armazenamento.carregar(), dados);
});

test('presenter ordena, deriva totais e formata período conhecido e migrado', () => {
  const conhecidos = {
    id: 'conhecido',
    inicio: dados.cicloAtual.inicio,
    dataEncerramento: '2026-07-19',
    configuracaoFinal: configuracao,
  };
  const migrado = { ...conhecidos, id: 'migrado', inicio: null, dataEncerramento: '2026-07-20' };
  const lista = criarApresentacaoListaCiclos([conhecidos, migrado]);
  assert.deepEqual(lista.map((item) => item.id), ['migrado', 'conhecido']);
  assert.equal(lista[0].periodo, 'Encerrado em 20/07/2026');
  assert.equal(lista[1].periodo, '01/07/2026 a 19/07/2026');
  assert.equal(lista[1].totalGasto, 'R$ 30,00');
  assert.equal(lista[1].quantidadeGastos, 2);
});

test('detalhe encontra ID, agrupa gastos e retorna estado seguro para ausente', () => {
  const ciclo = { id: 'ciclo', inicio: dados.cicloAtual.inicio, dataEncerramento: '2026-07-19', configuracaoFinal: configuracao };
  const detalhe = criarApresentacaoDetalheCiclo([ciclo], 'ciclo');
  assert.equal(detalhe?.grupos.length, 2);
  assert.equal(detalhe?.grupos[0].data, '19/07/2026');
  assert.equal(criarApresentacaoDetalheCiclo([ciclo], 'ausente'), null);
});

test('telas encerradas não oferecem ações de mutação', () => {
  const detalhe = readFileSync('src/features/cycle-history/components/CycleHistoryDetailScreen.tsx', 'utf8');
  assert.doesNotMatch(detalhe, /Editar|Excluir|Registrar gasto|Novo recebimento/);
});

test('histórico atual mantém edição/exclusão e oferece ciclos anteriores', () => {
  const atual = readFileSync('src/features/history/components/HistoryScreen.tsx', 'utf8');
  assert.match(atual, /label="Editar"/);
  assert.match(atual, /Excluir/);
  assert.match(atual, /Ver ciclos anteriores/);
});
