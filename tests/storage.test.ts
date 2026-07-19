import assert from 'node:assert/strict';
import test from 'node:test';

import type { EntradaCalculoDiario } from '../src/features/daily-limit';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import {
  CHAVE_PLANEJAMENTO,
  criarArmazenamentoPlanejamento,
  ErroArmazenamentoPlanejamento,
} from '../src/storage/planning-storage';
import {
  confirmarPlanejamentoPersistido,
  registrarGastoPersistido,
} from '../src/storage/planning-service';
import {
  desserializarPlanejamento,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
} from '../src/storage/serialization';
import {
  atualizarPlanejamentoParaData,
  hidratarPlanejamento,
} from '../src/storage/hydration';

const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 300_00,
  reserva: 20_00,
  contasPendentes: 115_00,
  dataAtual: '2026-07-19',
  dataProximoRecebimento: '2026-07-27',
  gastosRegistrados: [
    { valor: 10_00, data: '2026-07-18' },
    { valor: 5_50, data: '2026-07-19' },
  ],
};

function criarRepositorio(adaptador = new AdaptadorMemoria()) {
  return {
    adaptador,
    armazenamento: criarArmazenamentoPlanejamento(adaptador),
  };
}

test('salva e carrega uma configuração válida', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  assert.deepEqual(await armazenamento.carregar(), configuracaoBase);
});

test('retorna null quando não há dados persistidos', async () => {
  const { armazenamento } = criarRepositorio();
  assert.equal(await armazenamento.carregar(), null);
});

test('serialização e desserialização preservam todos os valores', () => {
  assert.deepEqual(
    desserializarPlanejamento(serializarPlanejamento(configuracaoBase)),
    configuracaoBase,
  );
});

test('gastos datados são preservados', () => {
  const restaurada = desserializarPlanejamento(
    serializarPlanejamento(configuracaoBase),
  );
  assert.deepEqual(restaurada.gastosRegistrados, configuracaoBase.gastosRegistrados);
});

test('resultado calculado não é armazenado', () => {
  const persistido = JSON.parse(serializarPlanejamento(configuracaoBase)) as Record<
    string,
    unknown
  >;
  assert.deepEqual(Object.keys(persistido).sort(), ['configuracao', 'versao']);
  assert.equal('resultado' in persistido, false);
});

test('resultado é recalculado após carregar', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  const estado = await hidratarPlanejamento(armazenamento, configuracaoBase.dataAtual);

  assert.equal(estado.tipo, 'pronto');
  if (estado.tipo === 'pronto') {
    assert.equal(estado.resultado.valorDisponivel, 165_00);
    assert.equal(estado.resultado.totalGastosRegistrados, 15_50);
  }
});

test('dataAtual é atualizada para a data civil de hoje e salva', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  const estado = await hidratarPlanejamento(armazenamento, '2026-07-20');

  assert.equal(estado.tipo, 'pronto');
  assert.equal((await armazenamento.carregar())?.dataAtual, '2026-07-20');
});

test('mudança de dia recalcula o orçamento', async () => {
  const { armazenamento } = criarRepositorio();
  const anterior = await hidratarPlanejamento(
    {
      carregar: async () => configuracaoBase,
      salvar: async () => undefined,
      remover: async () => undefined,
    },
    '2026-07-19',
  );
  const atual = await atualizarPlanejamentoParaData(
    armazenamento,
    configuracaoBase,
    '2026-07-20',
  );

  assert.equal(anterior.tipo, 'pronto');
  assert.equal(atual.tipo, 'pronto');
  if (anterior.tipo === 'pronto' && atual.tipo === 'pronto') {
    assert.notEqual(
      anterior.resultado.quantidadeDeDiasRestantes,
      atual.resultado.quantidadeDeDiasRestantes,
    );
    assert.equal(atual.resultado.totalGastosHoje, 0);
  }
});

test('data de recebimento vencida produz estado expirado sem apagar dados', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  const estado = await hidratarPlanejamento(armazenamento, '2026-07-28');

  assert.equal(estado.tipo, 'expirado');
  assert.equal((await armazenamento.carregar())?.saldoAtual, configuracaoBase.saldoAtual);
  assert.equal((await armazenamento.carregar())?.dataAtual, '2026-07-28');
});

test('JSON inválido é tratado como dado corrompido', async () => {
  const adaptador = new AdaptadorMemoria({
    [CHAVE_PLANEJAMENTO]: '{inválido',
  });
  const estado = await hidratarPlanejamento(
    criarArmazenamentoPlanejamento(adaptador),
    '2026-07-19',
  );

  assert.equal(estado.tipo, 'erro');
  if (estado.tipo === 'erro') {
    assert.equal(estado.origem, 'dados-corrompidos');
  }
});

test('versão desconhecida é rejeitada', () => {
  assert.throws(
    () =>
      desserializarPlanejamento(
        JSON.stringify({ versao: 2, configuracao: configuracaoBase }),
      ),
    (erro) =>
      erro instanceof ErroSerializacaoPlanejamento &&
      erro.codigo === 'VERSAO_DESCONHECIDA',
  );
});

test('campo ausente é rejeitado', () => {
  const { reserva: _reserva, ...incompleta } = configuracaoBase;
  assert.throws(
    () =>
      desserializarPlanejamento(
        JSON.stringify({ versao: 1, configuracao: incompleta }),
      ),
    (erro) =>
      erro instanceof ErroSerializacaoPlanejamento &&
      erro.codigo === 'DADOS_INVALIDOS',
  );
});

test('valor fracionário, NaN, Infinity e fora do intervalo seguro são rejeitados', () => {
  for (const saldoAtual of [
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(
      () =>
        validarEstadoPersistido({
          versao: 1,
          configuracao: { ...configuracaoBase, saldoAtual },
        }),
      (erro) =>
        erro instanceof ErroSerializacaoPlanejamento &&
        erro.codigo === 'DADOS_INVALIDOS',
    );
  }
});

test('gasto inválido é rejeitado', () => {
  for (const gasto of [
    { valor: 0, data: '2026-07-19' },
    { valor: 1.5, data: '2026-07-19' },
    { valor: 10_00, data: '2026-02-30' },
  ]) {
    assert.throws(
      () =>
        validarEstadoPersistido({
          versao: 1,
          configuracao: { ...configuracaoBase, gastosRegistrados: [gasto] },
        }),
      (erro) => erro instanceof ErroSerializacaoPlanejamento,
    );
  }
});

test('falha na leitura produz estado de erro sem remover dados', async () => {
  const { adaptador, armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  adaptador.falharLeitura = true;
  const estado = await hidratarPlanejamento(armazenamento, '2026-07-19');

  assert.equal(estado.tipo, 'erro');
  if (estado.tipo === 'erro') {
    assert.equal(estado.origem, 'leitura');
  }
});

test('falha na gravação não substitui a configuração persistida', async () => {
  const { adaptador, armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  adaptador.falharGravacao = true;
  const alterada = { ...configuracaoBase, saldoAtual: 999_00 };

  await assert.rejects(
    () => confirmarPlanejamentoPersistido(armazenamento, alterada),
    (erro) =>
      erro instanceof ErroArmazenamentoPlanejamento &&
      erro.codigo === 'GRAVACAO',
  );
  assert.deepEqual(await armazenamento.carregar(), configuracaoBase);
});

test('remover dados limpa o armazenamento', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  await armazenamento.remover();
  assert.equal(await armazenamento.carregar(), null);
});

test('confirmar onboarding salva a configuração e retorna resultado sincronizado', async () => {
  const { armazenamento } = criarRepositorio();
  const planejamento = await confirmarPlanejamentoPersistido(
    armazenamento,
    configuracaoBase,
  );

  assert.deepEqual(await armazenamento.carregar(), planejamento.configuracao);
  assert.equal(
    planejamento.resultado.valorDisponivel,
    planejamento.configuracao.saldoAtual -
      planejamento.configuracao.reserva -
      planejamento.configuracao.contasPendentes,
  );
});

test('registrar gasto salva saldo e gasto datado atualizados', async () => {
  const { armazenamento } = criarRepositorio();
  await armazenamento.salvar(configuracaoBase);
  const planejamento = await registrarGastoPersistido(
    armazenamento,
    configuracaoBase,
    'R$ 30,00',
    '2026-07-19',
  );

  assert.deepEqual(await armazenamento.carregar(), planejamento.configuracao);
  assert.equal(planejamento.configuracao.saldoAtual, 270_00);
  assert.deepEqual(planejamento.configuracao.gastosRegistrados.at(-1), {
    valor: 30_00,
    data: '2026-07-19',
  });
});

test('reiniciar o estado restaura planejamento pronto para a Home', async () => {
  const { armazenamento } = criarRepositorio();
  await confirmarPlanejamentoPersistido(armazenamento, configuracaoBase);
  const restaurado = await hidratarPlanejamento(
    armazenamento,
    configuracaoBase.dataAtual,
  );

  assert.equal(restaurado.tipo, 'pronto');
  if (restaurado.tipo === 'pronto') {
    assert.deepEqual(restaurado.configuracao, configuracaoBase);
    assert.ok(restaurado.resultado);
  }
});
