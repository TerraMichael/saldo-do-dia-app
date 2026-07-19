import {
  calcularPlanoDiario,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';

export type CodigoErroExclusaoGasto =
  | 'GASTO_NAO_ENCONTRADO'
  | 'VALOR_FORA_INTERVALO'
  | 'PLANEJAMENTO_VENCIDO';

export class ErroExclusaoGasto extends Error {
  constructor(
    public readonly codigo: CodigoErroExclusaoGasto,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroExclusaoGasto';
  }
}

export interface ExclusaoGastoConcluida {
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
}

export function excluirGasto(
  configuracaoAtual: EntradaCalculoDiario,
  id: string,
  dataAtual: string,
): ExclusaoGastoConcluida {
  const gasto = configuracaoAtual.gastosRegistrados.find(
    (registro) => registro.id === id,
  );
  if (!gasto) {
    throw new ErroExclusaoGasto(
      'GASTO_NAO_ENCONTRADO',
      'O gasto informado não foi encontrado.',
    );
  }

  const novoSaldoAtual = configuracaoAtual.saldoAtual + gasto.valor;
  if (!Number.isSafeInteger(novoSaldoAtual)) {
    throw new ErroExclusaoGasto(
      'VALOR_FORA_INTERVALO',
      'O saldo resultante está fora do intervalo monetário permitido.',
    );
  }

  const configuracao: EntradaCalculoDiario = {
    ...configuracaoAtual,
    saldoAtual: novoSaldoAtual,
    dataAtual,
    gastosRegistrados: configuracaoAtual.gastosRegistrados.filter(
      (registro) => registro.id !== id,
    ),
  };

  try {
    return {
      configuracao,
      resultado: calcularPlanoDiario(configuracao),
    };
  } catch (erro) {
    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'ORDEM_DE_DATAS_INVALIDA'
    ) {
      throw new ErroExclusaoGasto(
        'PLANEJAMENTO_VENCIDO',
        'O próximo recebimento já passou. Edite o planejamento antes de excluir um gasto.',
      );
    }
    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'VALOR_MONETARIO_INVALIDO'
    ) {
      throw new ErroExclusaoGasto(
        'VALOR_FORA_INTERVALO',
        'O total financeiro está fora do intervalo monetário permitido.',
      );
    }
    throw erro;
  }
}
