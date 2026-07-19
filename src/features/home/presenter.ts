import type {
  EntradaCalculoDiario,
  ResultadoCalculoDiario,
} from '../daily-limit';
import { formatarDataCivilParaExibicao } from '../onboarding/model';
import { formatarCentavosComoMoedaBrasileira } from '../../shared/money';

export type EstadoFinanceiroHome = 'positivo' | 'sem-valor-livre' | 'deficit';

export interface ApresentacaoHome {
  estado: EstadoFinanceiroHome;
  tituloEstado: string;
  mensagemEstado: string;
  restanteHoje: string;
  gastoHoje: string;
  limitePlanejadoHoje: string;
  excedenteHoje: string | null;
  limiteDiasFuturos: string | null;
  quantidadeDeDiasFuturos: number;
  saldoAtual: string;
  valorDisponivel: string;
  contasPendentes: string;
  reserva: string;
  totalGastosRegistrados: string;
  quantidadeDeDiasRestantes: number;
  quantidadeDeDiasTexto: string;
  dataProximoRecebimento: string;
  deficit: string | null;
}

export function criarApresentacaoHome(
  configuracao: EntradaCalculoDiario,
  resultado: ResultadoCalculoDiario,
): ApresentacaoHome {
  const temDeficit = resultado.valorDisponivel < 0;
  const semValorLivre = resultado.valorDisponivel === 0;
  const valorDisponivelVisual = Math.max(0, resultado.valorDisponivel);
  const deficit = temDeficit
    ? formatarCentavosComoMoedaBrasileira(Math.abs(resultado.valorDisponivel))
    : null;

  let estado: EstadoFinanceiroHome = 'positivo';
  let tituloEstado = 'Planejamento positivo';
  let mensagemEstado = 'Seu dinheiro livre foi distribuído até o próximo recebimento.';

  if (temDeficit) {
    estado = 'deficit';
    tituloEstado = 'Déficit identificado';
    mensagemEstado = `Faltam ${deficit} para cobrir sua reserva e contas pendentes.`;
  } else if (semValorLivre) {
    estado = 'sem-valor-livre';
    tituloEstado = 'Sem valor livre';
    mensagemEstado = 'Não há valor livre até o próximo recebimento.';
  }

  const quantidadeDeDiasRestantes = resultado.quantidadeDeDiasRestantes;

  return {
    estado,
    tituloEstado,
    mensagemEstado,
    restanteHoje: formatarCentavosComoMoedaBrasileira(resultado.restanteHoje),
    gastoHoje: formatarCentavosComoMoedaBrasileira(resultado.totalGastosHoje),
    limitePlanejadoHoje: formatarCentavosComoMoedaBrasileira(
      Math.max(0, resultado.limitePlanejadoHoje),
    ),
    excedenteHoje:
      resultado.excedenteHoje > 0
        ? formatarCentavosComoMoedaBrasileira(resultado.excedenteHoje)
        : null,
    limiteDiasFuturos:
      resultado.limiteDiasFuturos === null
        ? null
        : formatarCentavosComoMoedaBrasileira(Math.max(0, resultado.limiteDiasFuturos)),
    quantidadeDeDiasFuturos: resultado.quantidadeDeDiasFuturos,
    saldoAtual: formatarCentavosComoMoedaBrasileira(configuracao.saldoAtual),
    valorDisponivel: formatarCentavosComoMoedaBrasileira(valorDisponivelVisual),
    contasPendentes: formatarCentavosComoMoedaBrasileira(configuracao.contasPendentes),
    reserva: formatarCentavosComoMoedaBrasileira(configuracao.reserva),
    totalGastosRegistrados: formatarCentavosComoMoedaBrasileira(
      resultado.totalGastosRegistrados,
    ),
    quantidadeDeDiasRestantes,
    quantidadeDeDiasTexto: `${quantidadeDeDiasRestantes} ${
      quantidadeDeDiasRestantes === 1 ? 'dia' : 'dias'
    }`,
    dataProximoRecebimento: formatarDataCivilParaExibicao(
      configuracao.dataProximoRecebimento,
    ),
    deficit,
  };
}
