import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { DadosPlanejamento } from '../src/features/cycle-history';
import { criarApresentacaoDetalheCiclo } from '../src/features/cycle-history';
import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
} from '../src/features/daily-limit';
import {
  editarGasto,
  ErroDescricaoGasto,
  excluirGasto,
  LIMITE_DESCRICAO_GASTO,
  normalizarDescricaoGasto,
  registrarGasto,
} from '../src/features/expenses';
import { criarApresentacaoHistorico } from '../src/features/history';
import { AdaptadorMemoria } from '../src/storage/memory-storage-adapter';
import {
  CHAVE_PLANEJAMENTO,
  CHAVE_PLANEJAMENTO_LEGADO,
  CHAVE_PLANEJAMENTO_V2,
  criarArmazenamentoPlanejamento,
} from '../src/storage/planning-storage';
import {
  iniciarNovoCicloPersistido,
  registrarGastoPersistido,
} from '../src/storage/planning-service';
import {
  desserializarPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
  VERSAO_PLANEJAMENTO_PERSISTIDO,
} from '../src/storage/serialization';

const hoje = '2026-07-19';
const base: EntradaCalculoDiario = {
  saldoAtual: 300_00,
  reserva: 0,
  contasPendentes: 115_00,
  dataAtual: hoje,
  dataProximoRecebimento: '2026-07-27',
  gastosRegistrados: [],
};
const dadosBase: DadosPlanejamento = {
  cicloAtual: { id: 'atual', inicio: null, configuracao: base },
  ciclosEncerrados: [],
};

test('normalização trata ausência, vazio e somente espaços como ausência', () => {
  assert.equal(normalizarDescricaoGasto(undefined), undefined);
  assert.equal(normalizarDescricaoGasto(''), undefined);
  assert.equal(normalizarDescricaoGasto('   '), undefined);
});

test('normalização remove espaços externos e preserva conteúdo interno', () => {
  assert.equal(normalizarDescricaoGasto('  Presente   da Júlia!  '), 'Presente   da Júlia!');
});

test('normalização preserva acentos, pontuação e capitalização', () => {
  assert.equal(normalizarDescricaoGasto('Farmácia nº 2'), 'Farmácia nº 2');
  assert.equal(normalizarDescricaoGasto('aLmoço'), 'aLmoço');
});

test('aceita exatamente 80 caracteres e não corta silenciosamente', () => {
  const descricao = 'a'.repeat(LIMITE_DESCRICAO_GASTO);
  assert.equal(normalizarDescricaoGasto(descricao), descricao);
  assert.throws(
    () => normalizarDescricaoGasto(`${descricao}b`),
    (erro) => erro instanceof ErroDescricaoGasto,
  );
});

test('registra gasto sem descrição omitindo a propriedade', () => {
  const registro = registrarGasto(base, { valor: '10,00' }, hoje, () => 'gasto-1');
  assert.deepEqual(registro.configuracao.gastosRegistrados[0], {
    id: 'gasto-1',
    valor: 10_00,
    data: hoje,
  });
});

test('registra e normaliza descrição preservando ID, valor e data', () => {
  const registro = registrarGasto(
    base,
    { valor: '10,00', descricao: '  Mercado  ' },
    hoje,
    () => 'gasto-1',
  );
  assert.deepEqual(registro.configuracao.gastosRegistrados[0], {
    id: 'gasto-1',
    valor: 10_00,
    data: hoje,
    descricao: 'Mercado',
  });
});

test('descrição não altera saldo, totais ou limite financeiro', () => {
  const sem = registrarGasto(base, { valor: '30,00' }, hoje, () => 'sem');
  const com = registrarGasto(base, { valor: '30,00', descricao: 'Almoço' }, hoje, () => 'com');
  assert.equal(sem.configuracao.saldoAtual, com.configuracao.saldoAtual);
  assert.deepEqual(sem.resultado, com.resultado);
  assert.deepEqual(
    calcularPlanoDiario({ ...com.configuracao, gastosRegistrados: com.configuracao.gastosRegistrados.map(({ descricao: _descricao, ...gasto }) => gasto) }),
    com.resultado,
  );
});

test('erro de descrição não registra nem altera configuração', () => {
  const antes = JSON.stringify(base);
  assert.throws(
    () => registrarGasto(base, { valor: '10,00', descricao: 'x'.repeat(81) }, hoje, () => 'gasto'),
    ErroDescricaoGasto,
  );
  assert.equal(JSON.stringify(base), antes);
});

test('edição adiciona, altera e remove descrição', () => {
  const registrado = registrarGasto(base, { valor: '10,00' }, hoje, () => 'gasto');
  const adicionado = editarGasto(registrado.configuracao, 'gasto', { valor: '10,00', descricao: 'Mercado' }, hoje);
  const alterado = editarGasto(adicionado.configuracao, 'gasto', { valor: '10,00', descricao: 'Farmácia' }, hoje);
  const removido = editarGasto(alterado.configuracao, 'gasto', { valor: '10,00', descricao: '  ' }, hoje);
  assert.equal(adicionado.configuracao.gastosRegistrados[0].descricao, 'Mercado');
  assert.equal(alterado.configuracao.gastosRegistrados[0].descricao, 'Farmácia');
  assert.equal('descricao' in removido.configuracao.gastosRegistrados[0], false);
});

test('edição somente da descrição é alteração real e mantém saldo, ID e data', () => {
  const registrado = registrarGasto(base, { valor: '10,00' }, hoje, () => 'gasto');
  const editado = editarGasto(registrado.configuracao, 'gasto', { valor: '10,00', descricao: 'Mercado' }, hoje);
  const gasto = editado.configuracao.gastosRegistrados[0];
  assert.equal(editado.alterado, true);
  assert.equal(editado.configuracao.saldoAtual, registrado.configuracao.saldoAtual);
  assert.equal(gasto.id, 'gasto');
  assert.equal(gasto.data, hoje);
});

test('descrição normalizada igual retorna alterado false', () => {
  const configuracao = { ...base, gastosRegistrados: [{ id: 'gasto', valor: 10_00, data: hoje, descricao: 'Mercado' }] };
  const editado = editarGasto(configuracao, 'gasto', { valor: '10,00', descricao: '  Mercado  ' }, hoje);
  assert.equal(editado.alterado, false);
  assert.equal(editado.configuracao, configuracao);
});

test('edição conjunta corrige saldo e preserva outros gastos', () => {
  const configuracao: EntradaCalculoDiario = {
    ...base,
    saldoAtual: 270_00,
    gastosRegistrados: [
      { id: 'alvo', valor: 30_00, data: hoje, descricao: 'Antiga' },
      { id: 'outro', valor: 5_00, data: hoje, descricao: 'Intacta' },
    ],
  };
  const editado = editarGasto(configuracao, 'alvo', { valor: '20,00', descricao: 'Nova' }, hoje);
  assert.equal(editado.configuracao.saldoAtual, 280_00);
  assert.deepEqual(editado.configuracao.gastosRegistrados[1], configuracao.gastosRegistrados[1]);
});

test('exclusão devolve somente o valor e preserva demais registros descritos', () => {
  const configuracao: EntradaCalculoDiario = {
    ...base,
    saldoAtual: 270_00,
    gastosRegistrados: [
      { id: 'alvo', valor: 30_00, data: hoje, descricao: 'Mercado' },
      { id: 'outro', valor: 5_00, data: hoje, descricao: 'Ônibus' },
    ],
  };
  const excluido = excluirGasto(configuracao, 'alvo', hoje);
  assert.equal(excluido.configuracao.saldoAtual, 300_00);
  assert.deepEqual(excluido.configuracao.gastosRegistrados, [configuracao.gastosRegistrados[1]]);
});

test('v3 antigo sem descrição continua válido e round-trip preserva descrição', () => {
  const antigo = desserializarPlanejamento(serializarPlanejamento(dadosBase));
  assert.equal(antigo.cicloAtual.configuracao.gastosRegistrados.length, 0);
  const descrito: DadosPlanejamento = {
    ...dadosBase,
    cicloAtual: {
      ...dadosBase.cicloAtual,
      configuracao: {
        ...base,
        gastosRegistrados: [{ id: 'gasto', valor: 10_00, data: hoje, descricao: 'Mercado' }],
      },
    },
  };
  assert.deepEqual(desserializarPlanejamento(serializarPlanejamento(descrito)), descrito);
});

test('desserialização omite descrição vazia e rejeita tipo ou tamanho inválido', () => {
  const documento = { versao: 3, dados: { ...dadosBase, cicloAtual: { ...dadosBase.cicloAtual, configuracao: { ...base, gastosRegistrados: [{ id: 'gasto', valor: 10_00, data: hoje, descricao: '   ' }] } } } };
  const validado = validarEstadoPersistido(documento);
  assert.equal('descricao' in validado.dados.cicloAtual.configuracao.gastosRegistrados[0], false);
  for (const descricao of [123, 'x'.repeat(81)]) {
    assert.throws(() => validarEstadoPersistido({
      ...documento,
      dados: { ...documento.dados, cicloAtual: { ...documento.dados.cicloAtual, configuracao: { ...base, gastosRegistrados: [{ id: 'gasto', valor: 10_00, data: hoje, descricao }] } } },
    }));
  }
});

test('descrições do ciclo atual e encerrado são preservadas em v3', () => {
  const gasto = { id: 'gasto', valor: 10_00, data: hoje, descricao: 'Mercado' };
  const dados: DadosPlanejamento = {
    cicloAtual: { ...dadosBase.cicloAtual, configuracao: { ...base, gastosRegistrados: [gasto] } },
    ciclosEncerrados: [{ id: 'antigo', inicio: null, dataEncerramento: hoje, configuracaoFinal: { ...base, gastosRegistrados: [gasto] } }],
  };
  assert.deepEqual(desserializarPlanejamento(serializarPlanejamento(dados)), dados);
});

test('migrações v1 e v2 não inventam descrição e a versão/chave continuam v3', async () => {
  const v2 = JSON.stringify({ versao: 2, configuracao: { ...base, gastosRegistrados: [{ id: 'gasto', valor: 10_00, data: hoje }] } });
  const v1 = JSON.stringify({ versao: 1, configuracao: { ...base, gastosRegistrados: [{ valor: 10_00, data: hoje }] } });
  for (const [chave, documento] of [[CHAVE_PLANEJAMENTO_V2, v2], [CHAVE_PLANEJAMENTO_LEGADO, v1]] as const) {
    const migrado = await criarArmazenamentoPlanejamento(new AdaptadorMemoria({ [chave]: documento })).carregar();
    assert.equal(migrado?.cicloAtual.configuracao.gastosRegistrados[0].descricao, undefined);
  }
  assert.equal(VERSAO_PLANEJAMENTO_PERSISTIDO, 3);
  assert.equal(CHAVE_PLANEJAMENTO, '@saldo-do-dia/planejamento:v3');
});

test('registro persistido preserva ciclos encerrados', async () => {
  const encerrado = { id: 'antigo', inicio: null, dataEncerramento: hoje, configuracaoFinal: base };
  const dados = { ...dadosBase, ciclosEncerrados: [encerrado] };
  const armazenamento = criarArmazenamentoPlanejamento(new AdaptadorMemoria());
  const salvo = await registrarGastoPersistido(armazenamento, dados, { valor: '10,00', descricao: 'Mercado' }, hoje, () => 'gasto');
  assert.equal(salvo.dados.ciclosEncerrados[0], encerrado);
  assert.equal(salvo.configuracao.gastosRegistrados[0].descricao, 'Mercado');
});

test('novo ciclo arquiva descrições e falha não as perde', async () => {
  const gasto = { id: 'gasto', valor: 10_00, data: hoje, descricao: 'Mercado' };
  const dados: DadosPlanejamento = {
    ...dadosBase,
    cicloAtual: { ...dadosBase.cicloAtual, configuracao: { ...base, gastosRegistrados: [gasto] } },
  };
  const adaptador = new AdaptadorMemoria();
  const armazenamento = criarArmazenamentoPlanejamento(adaptador);
  await armazenamento.salvar(dados);
  const formulario = { saldoAtual: '100,00', dataProximoRecebimento: '2026-08-01' };
  const novo = await iniciarNovoCicloPersistido(armazenamento, dados, formulario, hoje, () => 'novo');
  assert.equal(novo.dados.ciclosEncerrados[0].configuracaoFinal.gastosRegistrados[0].descricao, 'Mercado');
  assert.deepEqual(novo.configuracao.gastosRegistrados, []);

  await armazenamento.salvar(dados);
  adaptador.falharGravacao = true;
  await assert.rejects(() => iniciarNovoCicloPersistido(armazenamento, dados, formulario, hoje, () => 'falha'));
  adaptador.falharGravacao = false;
  assert.equal((await armazenamento.carregar())?.cicloAtual.configuracao.gastosRegistrados[0].descricao, 'Mercado');
});

test('presenter atual usa descrição e fallback sem alterar agrupamento', () => {
  const apresentacao = criarApresentacaoHistorico([
    { id: 'um', valor: 10_00, data: hoje, descricao: 'Mercado' },
    { id: 'dois', valor: 20_00, data: hoje },
  ], hoje);
  assert.deepEqual(apresentacao.grupos[0].itens.map((item) => item.descricao), ['Gasto registrado', 'Mercado']);
  assert.equal(apresentacao.grupos.length, 1);
});

test('presenter encerrado usa descrição e fallback sem ações', () => {
  const ciclo = {
    id: 'antigo',
    inicio: null,
    dataEncerramento: hoje,
    configuracaoFinal: {
      ...base,
      gastosRegistrados: [
        { id: 'um', valor: 10_00, data: hoje, descricao: 'Mercado' },
        { id: 'dois', valor: 20_00, data: hoje },
      ],
    },
  };
  const detalhe = criarApresentacaoDetalheCiclo([ciclo], 'antigo');
  assert.deepEqual(detalhe?.grupos[0].gastos.map((gasto) => gasto.descricao), ['Gasto registrado', 'Mercado']);
  const tela = readFileSync('src/features/cycle-history/components/CycleHistoryDetailScreen.tsx', 'utf8');
  assert.doesNotMatch(tela, /Editar|Excluir/);
});

test('AppTextField é exportado e formulários limitam a descrição', () => {
  const ui = readFileSync('src/ui/index.ts', 'utf8');
  const registro = readFileSync('src/features/expenses/components/ExpenseForm.tsx', 'utf8');
  const edicao = readFileSync('src/features/expenses/components/EditExpenseScreen.tsx', 'utf8');
  assert.match(ui, /AppTextField/);
  assert.match(registro, /Descrição \(opcional\)/);
  assert.match(edicao, /Descrição \(opcional\)/);
  assert.match(registro, /maxLength=\{LIMITE_DESCRICAO_GASTO\}/);
});
