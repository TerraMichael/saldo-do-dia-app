import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';
import {
  validarDadosNovoCiclo,
  type DadosFormularioNovoCiclo,
} from './model';

export interface NovoCicloCriado {
  configuracao: EntradaCalculoDiario;
  resultado: ResultadoCalculoDiario;
}

export function iniciarNovoCiclo(
  dados: DadosFormularioNovoCiclo,
  dataAtual: string,
): NovoCicloCriado {
  const validados = validarDadosNovoCiclo(dados, dataAtual);
  const configuracao: EntradaCalculoDiario = {
    saldoAtual: validados.saldoAtual,
    contasPendentes: validados.contasPendentes,
    reserva: validados.reserva,
    dataAtual,
    dataProximoRecebimento: validados.dataProximoRecebimento,
    gastosRegistrados: [],
  };

  return {
    configuracao,
    resultado: calcularPlanoDiario(configuracao),
  };
}
