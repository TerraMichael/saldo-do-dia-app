import type { EntradaCalculoDiario } from '../daily-limit';

export interface ResumoInicialCiclo {
  dataInicio: string;
  saldoInicial: number;
  reservaInicial: number;
  contasPendentesIniciais: number;
  dataProximoRecebimentoPrevista: string;
}

export interface CicloAtual {
  id: string;
  inicio: ResumoInicialCiclo | null;
  configuracao: EntradaCalculoDiario;
}

export interface CicloEncerrado {
  id: string;
  inicio: ResumoInicialCiclo | null;
  dataEncerramento: string;
  configuracaoFinal: EntradaCalculoDiario;
}

export interface DadosPlanejamento {
  cicloAtual: CicloAtual;
  ciclosEncerrados: readonly CicloEncerrado[];
}

export type GeradorIdCiclo = () => string;

export function criarResumoInicialCiclo(
  configuracao: EntradaCalculoDiario,
): ResumoInicialCiclo {
  return {
    dataInicio: configuracao.dataAtual,
    saldoInicial: configuracao.saldoAtual,
    reservaInicial: configuracao.reserva,
    contasPendentesIniciais: configuracao.contasPendentes,
    dataProximoRecebimentoPrevista: configuracao.dataProximoRecebimento,
  };
}

export function criarDadosPrimeiroCiclo(
  configuracao: EntradaCalculoDiario,
  gerarId: GeradorIdCiclo,
): DadosPlanejamento {
  return {
    cicloAtual: {
      id: gerarId(),
      inicio: criarResumoInicialCiclo(configuracao),
      configuracao,
    },
    ciclosEncerrados: [],
  };
}
