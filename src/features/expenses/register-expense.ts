import {
  calcularPlanoDiario,
  ErroCalculoFinanceiro,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';
import {
  converterMoedaBrasileiraParaCentavos,
  ErroMoeda,
} from '../../shared/money';

export type CodigoErroRegistroGasto =
  | 'VALOR_OBRIGATORIO'
  | 'VALOR_INVALIDO'
  | 'VALOR_NAO_POSITIVO'
  | 'VALOR_FORA_INTERVALO'
  | 'PLANEJAMENTO_VENCIDO';

export class ErroRegistroGasto extends Error {
  constructor(
    public readonly codigo: CodigoErroRegistroGasto,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroRegistroGasto';
  }
}

export interface RegistroGastoConcluido {
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
}

export type GeradorIdGasto = () => string;

export function converterValorGastoParaCentavos(valor: string): number {
  if (!valor.trim()) {
    throw new ErroRegistroGasto('VALOR_OBRIGATORIO', 'Informe o valor do gasto.');
  }

  let centavos: number;

  try {
    centavos = converterMoedaBrasileiraParaCentavos(valor);
  } catch (erro) {
    if (erro instanceof ErroMoeda) {
      const codigo =
        erro.codigo === 'VALOR_FORA_INTERVALO' ? 'VALOR_FORA_INTERVALO' : 'VALOR_INVALIDO';
      throw new ErroRegistroGasto(codigo, erro.message);
    }
    throw erro;
  }

  if (centavos <= 0) {
    throw new ErroRegistroGasto(
      'VALOR_NAO_POSITIVO',
      'O gasto deve ser maior que R$ 0,00.',
    );
  }

  return centavos;
}

export function registrarGasto(
  configuracaoAtual: EntradaCalculoDiario,
  valor: string,
  dataAtual: string,
  gerarId: GeradorIdGasto,
): RegistroGastoConcluido {
  const gasto = converterValorGastoParaCentavos(valor);
  const id = gerarId();

  if (!id.trim()) {
    throw new ErroRegistroGasto('VALOR_INVALIDO', 'Não foi possível identificar o gasto.');
  }
  if (configuracaoAtual.gastosRegistrados.some((registro) => registro.id === id)) {
    throw new ErroRegistroGasto('VALOR_INVALIDO', 'O identificador gerado para o gasto já existe.');
  }

  const novoSaldoAtual = configuracaoAtual.saldoAtual - gasto;

  if (!Number.isSafeInteger(novoSaldoAtual)) {
    throw new ErroRegistroGasto(
      'VALOR_FORA_INTERVALO',
      'O saldo resultante está fora do intervalo monetário permitido.',
    );
  }

  const novosGastosRegistrados = [
    ...configuracaoAtual.gastosRegistrados,
    { id, valor: gasto, data: dataAtual },
  ];
  const configuracao: EntradaCalculoDiario = {
    ...configuracaoAtual,
    saldoAtual: novoSaldoAtual,
    gastosRegistrados: novosGastosRegistrados,
    dataAtual,
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
      throw new ErroRegistroGasto(
        'PLANEJAMENTO_VENCIDO',
        'O próximo recebimento já passou. Edite o planejamento antes de registrar um gasto.',
      );
    }

    if (
      erro instanceof ErroCalculoFinanceiro &&
      erro.codigo === 'VALOR_MONETARIO_INVALIDO'
    ) {
      throw new ErroRegistroGasto(
        'VALOR_FORA_INTERVALO',
        'O total financeiro está fora do intervalo monetário permitido.',
      );
    }

    throw erro;
  }
}
