import assert from 'node:assert/strict';
import test from 'node:test';
import type { DadosPlanejamento } from '../src/features/cycle-history';
import type { EntradaCalculoDiario } from '../src/features/daily-limit';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import {
  CHAVE_PLANEJAMENTO,
  CHAVE_PLANEJAMENTO_LEGADO,
  CHAVE_PLANEJAMENTO_V2,
  criarArmazenamentoPlanejamento,
  ErroArmazenamentoPlanejamento,
} from '../src/storage/planning-storage';
import {
  criarIdDeterministicoCicloMigrado,
  criarIdDeterministicoGastoLegado,
} from '../src/storage/migration';
import {
  desserializarPlanejamento,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
} from '../src/storage/serialization';
import { hidratarPlanejamento } from '../src/storage/hydration';

const configuracao: EntradaCalculoDiario = {
  saldoAtual: 300_00,
  reserva: 20_00,
  contasPendentes: 115_00,
  dataAtual: '2026-07-19',
  dataProximoRecebimento: '2026-07-27',
  gastosRegistrados: [{ id: 'gasto-1', valor: 10_00, data: '2026-07-19' }],
};
const dados: DadosPlanejamento = {
  cicloAtual: {
    id: 'ciclo-atual',
    inicio: {
      dataInicio: '2026-07-01',
      saldoInicial: 400_00,
      reservaInicial: 20_00,
      contasPendentesIniciais: 115_00,
      dataProximoRecebimentoPrevista: '2026-07-27',
    },
    configuracao,
  },
  ciclosEncerrados: [{
    id: 'ciclo-antigo',
    inicio: null,
    dataEncerramento: '2026-07-01',
    configuracaoFinal: { ...configuracao, dataAtual: '2026-06-30' },
  }],
};
const documentoV2 = JSON.stringify({ versao: 2, configuracao });
const documentoV1 = JSON.stringify({
  versao: 1,
  configuracao: {
    ...configuracao,
    gastosRegistrados: [{ valor: 10_00, data: '2026-07-19' }],
  },
});

test('serializa e desserializa v3 preservando ciclo atual e encerrados', () => {
  assert.deepEqual(desserializarPlanejamento(serializarPlanejamento(dados)), dados);
  const documento = JSON.parse(serializarPlanejamento(dados));
  assert.equal(documento.versao, 3);
  assert.equal('resultado' in documento, false);
});

test('validação v3 rejeita versão, ID vazio, IDs duplicados e coleção inválida', () => {
  assert.throws(() => validarEstadoPersistido({ versao: 4 }), ErroSerializacaoPlanejamento);
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, cicloAtual: { ...dados.cicloAtual, id: ' ' } } }), ErroSerializacaoPlanejamento);
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, ciclosEncerrados: [{ ...dados.ciclosEncerrados[0], id: dados.cicloAtual.id }] } }), ErroSerializacaoPlanejamento);
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, ciclosEncerrados: {} } }), ErroSerializacaoPlanejamento);
});

test('validação rejeita data final inválida e início posterior ao encerramento', () => {
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, ciclosEncerrados: [{ ...dados.ciclosEncerrados[0], dataEncerramento: '2026-02-30' }] } }));
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, ciclosEncerrados: [{ ...dados.ciclosEncerrados[0], inicio: { ...dados.cicloAtual.inicio!, dataInicio: '2026-08-01' } }] } }));
});

test('aceita início null e rejeita configuração e IDs de gasto duplicados', () => {
  assert.equal(desserializarPlanejamento(serializarPlanejamento(dados)).ciclosEncerrados[0].inicio, null);
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, cicloAtual: { ...dados.cicloAtual, configuracao: { ...configuracao, reserva: -1 } } } }));
  assert.throws(() => validarEstadoPersistido({ versao: 3, dados: { ...dados, cicloAtual: { ...dados.cicloAtual, configuracao: { ...configuracao, gastosRegistrados: [configuracao.gastosRegistrados[0], configuracao.gastosRegistrados[0]] } } } }));
});

test('salva e carrega v3; vazio retorna null', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  assert.equal(await armazenamento.carregar(), null);
  await armazenamento.salvar(dados);
  assert.deepEqual(await armazenamento.carregar(), dados);
});

test('migra v2 para v3 sem perder configuração, usa início null e ID determinístico', async () => {
  const adaptador = new AdaptadorMemoria({ [CHAVE_PLANEJAMENTO_V2]: documentoV2 });
  const migrado = await criarArmazenamentoPlanejamento(adaptador).carregar();
  assert.deepEqual(migrado?.cicloAtual.configuracao, configuracao);
  assert.equal(migrado?.cicloAtual.inicio, null);
  assert.deepEqual(migrado?.ciclosEncerrados, []);
  assert.equal(migrado?.cicloAtual.id, criarIdDeterministicoCicloMigrado(configuracao));
  assert.ok(await adaptador.obter(CHAVE_PLANEJAMENTO));
  assert.equal(await adaptador.obter(CHAVE_PLANEJAMENTO_V2), null);
});

test('migra v1 até v3 preservando ID determinístico do gasto', async () => {
  const adaptador = new AdaptadorMemoria({ [CHAVE_PLANEJAMENTO_LEGADO]: documentoV1 });
  const migrado = await criarArmazenamentoPlanejamento(adaptador).carregar();
  assert.equal(migrado?.cicloAtual.configuracao.gastosRegistrados[0].id, criarIdDeterministicoGastoLegado(0, '2026-07-19', 10_00));
});

test('prioriza v3 quando versões antigas coexistem', async () => {
  const adaptador = new AdaptadorMemoria({
    [CHAVE_PLANEJAMENTO]: serializarPlanejamento(dados),
    [CHAVE_PLANEJAMENTO_V2]: documentoV2,
  });
  assert.deepEqual(await criarArmazenamentoPlanejamento(adaptador).carregar(), dados);
  assert.equal(await adaptador.obter(CHAVE_PLANEJAMENTO_V2), documentoV2);
});

test('falha ao gravar v3 preserva v2', async () => {
  const adaptador = new AdaptadorMemoria({ [CHAVE_PLANEJAMENTO_V2]: documentoV2 });
  adaptador.falharGravacao = true;
  await assert.rejects(() => criarArmazenamentoPlanejamento(adaptador).carregar(), (erro) => erro instanceof ErroArmazenamentoPlanejamento && erro.codigo === 'GRAVACAO');
  assert.equal(await adaptador.obter(CHAVE_PLANEJAMENTO_V2), documentoV2);
});

test('remoção explícita ocorre em v1, v2 e v3', async () => {
  const ordem: string[] = [];
  const adaptador = {
    obter: async () => null,
    salvar: async () => undefined,
    remover: async (chave: string) => { ordem.push(chave); },
  };
  await criarArmazenamentoPlanejamento(adaptador).remover();
  assert.deepEqual(ordem, [CHAVE_PLANEJAMENTO_LEGADO, CHAVE_PLANEJAMENTO_V2, CHAVE_PLANEJAMENTO]);
});

test('hidratação recalcula somente o ciclo atual e atualiza a data', async () => {
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  await armazenamento.salvar(dados);
  const estado = await hidratarPlanejamento(armazenamento, '2026-07-20');
  assert.equal(estado.tipo, 'pronto');
  if (estado.tipo === 'pronto') {
    assert.equal(estado.configuracao.dataAtual, '2026-07-20');
    assert.equal(estado.dados.ciclosEncerrados[0].configuracaoFinal.dataAtual, '2026-06-30');
  }
});
