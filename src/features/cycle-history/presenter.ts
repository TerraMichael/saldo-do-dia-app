import { formatarCentavosComoMoedaBrasileira } from '../../shared/money';
import { agruparGastosPorData } from '../history';
import type { CicloEncerrado } from './model';

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function totalGasto(ciclo: CicloEncerrado): number {
  return ciclo.configuracaoFinal.gastosRegistrados.reduce(
    (total, gasto) => total + gasto.valor,
    0,
  );
}

export function criarApresentacaoCiclo(ciclo: CicloEncerrado) {
  const encerramento = formatarData(ciclo.dataEncerramento);
  return {
    id: ciclo.id,
    periodo: ciclo.inicio
      ? `${formatarData(ciclo.inicio.dataInicio)} a ${encerramento}`
      : `Encerrado em ${encerramento}`,
    dataEncerramento: encerramento,
    totalGasto: formatarCentavosComoMoedaBrasileira(totalGasto(ciclo)),
    quantidadeGastos: ciclo.configuracaoFinal.gastosRegistrados.length,
    saldoFinal: formatarCentavosComoMoedaBrasileira(ciclo.configuracaoFinal.saldoAtual),
  };
}

export function criarApresentacaoListaCiclos(
  ciclos: readonly CicloEncerrado[],
) {
  return [...ciclos]
    .sort((a, b) => b.dataEncerramento.localeCompare(a.dataEncerramento))
    .map(criarApresentacaoCiclo);
}

export function criarApresentacaoDetalheCiclo(
  ciclos: readonly CicloEncerrado[],
  id: string,
) {
  const ciclo = ciclos.find((item) => item.id === id);
  if (!ciclo) return null;
  const base = criarApresentacaoCiclo(ciclo);
  const grupos = agruparGastosPorData(ciclo.configuracaoFinal.gastosRegistrados).map(
    (grupo) => ({
      data: formatarData(grupo.dataCivil),
      total: formatarCentavosComoMoedaBrasileira(grupo.total),
      gastos: grupo.gastos.map((gasto) => ({
        id: gasto.id,
        valor: formatarCentavosComoMoedaBrasileira(gasto.valor),
        descricao: gasto.descricao ?? 'Gasto registrado',
      })),
    }),
  );
  return {
    ...base,
    inicioDisponivel: ciclo.inicio !== null,
    recebimentoPrevisto: formatarData(
      ciclo.inicio?.dataProximoRecebimentoPrevista ??
        ciclo.configuracaoFinal.dataProximoRecebimento,
    ),
    saldoInicial: ciclo.inicio
      ? formatarCentavosComoMoedaBrasileira(ciclo.inicio.saldoInicial)
      : null,
    reservaInicial: ciclo.inicio
      ? formatarCentavosComoMoedaBrasileira(ciclo.inicio.reservaInicial)
      : null,
    contasIniciais: ciclo.inicio
      ? formatarCentavosComoMoedaBrasileira(ciclo.inicio.contasPendentesIniciais)
      : null,
    reservaFinal: formatarCentavosComoMoedaBrasileira(ciclo.configuracaoFinal.reserva),
    contasFinais: formatarCentavosComoMoedaBrasileira(ciclo.configuracaoFinal.contasPendentes),
    grupos,
  };
}
