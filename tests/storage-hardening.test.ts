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
} from '../src/storage/planning-storage';
import {
  desserializarPlanejamento,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
} from '../src/storage/serialization';

const configuration: EntradaCalculoDiario = {
  saldoAtual: 10_000,
  reserva: 100,
  contasPendentes: 200,
  dataAtual: '2026-01-01',
  dataProximoRecebimento: '2026-01-10',
  gastosRegistrados: [
    { id: 'expense', valor: 100, data: '2026-01-01', descricao: 'Café' },
  ],
};
const data: DadosPlanejamento = {
  cicloAtual: { id: 'current', inicio: null, configuracao: configuration },
  ciclosEncerrados: [],
};

test('documentos inválidos são rejeitados sem cast ou remoção automática', async () => {
  const invalidDocuments: unknown[] = [
    null,
    [],
    {},
    { versao: 4 },
    { versao: 3, dados: {} },
    { versao: 3, dados: { cicloAtual: data.cicloAtual, ciclosEncerrados: {} } },
    {
      versao: 3,
      dados: {
        ...data,
        cicloAtual: {
          ...data.cicloAtual,
          configuracao: { ...configuration, saldoAtual: 1.5 },
        },
      },
    },
    {
      versao: 3,
      dados: {
        ...data,
        cicloAtual: {
          ...data.cicloAtual,
          configuracao: {
            ...configuration,
            gastosRegistrados: [{ valor: 1, data: '2026-01-01' }],
          },
        },
      },
    },
  ];
  for (const document of invalidDocuments) {
    assert.throws(
      () => validarEstadoPersistido(document),
      ErroSerializacaoPlanejamento,
    );
  }

  const adapter = new AdaptadorMemoria({
    [CHAVE_PLANEJAMENTO]: '{invalid',
  });
  await assert.rejects(() =>
    criarArmazenamentoPlanejamento(adapter).carregar(),
  );
  assert.equal(await adapter.obter(CHAVE_PLANEJAMENTO), '{invalid');
});

test('campos extras são ignorados com saída canônica validada', () => {
  const validated = validarEstadoPersistido({
    versao: 3,
    extra: 'ignored',
    dados: {
      ...data,
      extra: true,
      cicloAtual: { ...data.cicloAtual, extra: true },
    },
  });
  assert.equal('extra' in validated, false);
  assert.equal('extra' in validated.dados, false);
  assert.equal('extra' in validated.dados.cicloAtual, false);
});

test('round-trip cria cópias independentes entre ativo e encerrado', () => {
  const withArchive: DadosPlanejamento = {
    cicloAtual: data.cicloAtual,
    ciclosEncerrados: [
      {
        id: 'archive',
        inicio: null,
        dataEncerramento: '2026-01-02',
        configuracaoFinal: structuredClone(configuration),
      },
    ],
  };
  const restored = desserializarPlanejamento(serializarPlanejamento(withArchive));
  assert.notEqual(
    restored.cicloAtual.configuracao,
    restored.ciclosEncerrados[0].configuracaoFinal,
  );
  assert.notEqual(
    restored.cicloAtual.configuracao.gastosRegistrados,
    restored.ciclosEncerrados[0].configuracaoFinal.gastosRegistrados,
  );
});

test('migração salva v3 antes de remover legado e falha de remoção preserva v3', async () => {
  const events: string[] = [];
  const v2 = JSON.stringify({ versao: 2, configuracao: configuration });
  const values = new Map([[CHAVE_PLANEJAMENTO_V2, v2]]);
  const adapter = {
    obter: async (key: string) => values.get(key) ?? null,
    salvar: async (key: string, value: string) => {
      events.push(`save:${key}`);
      values.set(key, value);
    },
    remover: async (key: string) => {
      events.push(`remove:${key}`);
      throw new Error('simulated removal failure');
    },
  };
  const restored = await criarArmazenamentoPlanejamento(adapter).carregar();
  assert.ok(restored);
  assert.deepEqual(events, [
    `save:${CHAVE_PLANEJAMENTO}`,
    `remove:${CHAVE_PLANEJAMENTO_V2}`,
  ]);
  assert.ok(values.get(CHAVE_PLANEJAMENTO));
  assert.equal(values.get(CHAVE_PLANEJAMENTO_V2), v2);
});

test('remoção explícita mantém a ordem segura mesmo com chaves legadas', async () => {
  const events: string[] = [];
  const storage = criarArmazenamentoPlanejamento({
    obter: async () => null,
    salvar: async () => undefined,
    remover: async (key) => {
      events.push(key);
    },
  });
  await storage.remover();
  assert.deepEqual(events, [
    CHAVE_PLANEJAMENTO_LEGADO,
    CHAVE_PLANEJAMENTO_V2,
    CHAVE_PLANEJAMENTO,
  ]);
});
