import {
  calcularPlanoDiario,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';
import {
  converterValorGastoParaCentavos,
  type DadosFormularioGasto,
} from './register-expense';
import { normalizarDescricaoGasto } from './description';

export type CodigoErroEdicaoGasto =
  | 'GASTO_NAO_ENCONTRADO'
  | 'VALOR_FORA_INTERVALO'
  | 'PLANEJAMENTO_VENCIDO';

export class ErroEdicaoGasto extends Error {
  constructor(
    public readonly codigo: CodigoErroEdicaoGasto,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroEdicaoGasto';
  }
}

export interface EdicaoGastoConcluida {
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
  alterado: boolean;
}

function recalcular(
  configuracao: EntradaCalculoDiario,
): ResultadoCalculoDiario {
  try {
    return calcularPlanoDiario(configuracao);
  } catch (erro) {
    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'ORDEM_DE_DATAS_INVALIDA'
    ) {
      throw new ErroEdicaoGasto(
        'PLANEJAMENTO_VENCIDO',
        'O próximo recebimento já passou. Edite o planejamento antes de alterar um gasto.',
      );
    }
    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'VALOR_MONETARIO_INVALIDO'
    ) {
      throw new ErroEdicaoGasto(
        'VALOR_FORA_INTERVALO',
        'O total financeiro está fora do intervalo monetário permitido.',
      );
    }
    throw erro;
  }
}

export function editarGasto(
  configuracaoAtual: EntradaCalculoDiario,
  id: string,
  dados: DadosFormularioGasto,
  dataAtual: string,
): EdicaoGastoConcluida {
  const indice = configuracaoAtual.gastosRegistrados.findIndex(
    (gasto) => gasto.id === id,
  );
  if (indice < 0) {
    throw new ErroEdicaoGasto(
      'GASTO_NAO_ENCONTRADO',
      'O gasto informado não foi encontrado.',
    );
  }

  const valor = converterValorGastoParaCentavos(dados.valor);
  const descricao = normalizarDescricaoGasto(dados.descricao);
  const gastoAtual = configuracaoAtual.gastosRegistrados[indice];

  if (
    valor === gastoAtual.valor &&
    descricao === gastoAtual.descricao &&
    dataAtual === configuracaoAtual.dataAtual
  ) {
    return {
      configuracao: configuracaoAtual,
      resultado: recalcular(configuracaoAtual),
      alterado: false,
    };
  }

  const novoSaldoAtual =
    configuracaoAtual.saldoAtual + gastoAtual.valor - valor;
  if (!Number.isSafeInteger(novoSaldoAtual)) {
    throw new ErroEdicaoGasto(
      'VALOR_FORA_INTERVALO',
      'O saldo resultante está fora do intervalo monetário permitido.',
    );
  }

  const gastosRegistrados = configuracaoAtual.gastosRegistrados.map(
    (gasto, gastoIndice) =>
      gastoIndice === indice
        ? {
            id: gasto.id,
            valor,
            data: gasto.data,
            ...(descricao ? { descricao } : {}),
          }
        : gasto,
  );
  const configuracao: EntradaCalculoDiario = {
    ...configuracaoAtual,
    saldoAtual: novoSaldoAtual,
    dataAtual,
    gastosRegistrados,
  };

  return {
    configuracao,
    resultado: recalcular(configuracao),
    alterado: true,
  };
}
