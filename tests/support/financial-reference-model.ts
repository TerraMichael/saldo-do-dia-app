import type {
  EntradaCalculoDiario,
  ResultadoCalculoDiario,
} from '../../src/features/daily-limit';

const DAY_MS = 86_400_000;

function civilDay(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calcularPlanoReferencia(
  entrada: EntradaCalculoDiario,
): ResultadoCalculoDiario {
  const valorDisponivel =
    entrada.saldoAtual - entrada.reserva - entrada.contasPendentes;
  const quantidadeDeDiasRestantes = Math.max(
    1,
    (civilDay(entrada.dataProximoRecebimento) -
      civilDay(entrada.dataAtual)) /
      DAY_MS,
  );
  let totalGastosRegistrados = 0;
  let totalGastosHoje = 0;

  for (const gasto of entrada.gastosRegistrados) {
    totalGastosRegistrados += gasto.valor;
    if (gasto.data === entrada.dataAtual) totalGastosHoje += gasto.valor;
  }

  const limitePlanejadoHoje = Math.floor(
    (valorDisponivel + totalGastosHoje) /
      quantidadeDeDiasRestantes,
  );
  const restanteHoje = Math.max(
    0,
    limitePlanejadoHoje - totalGastosHoje,
  );
  const excedenteHoje = Math.max(
    0,
    totalGastosHoje - Math.max(0, limitePlanejadoHoje),
  );
  const quantidadeDeDiasFuturos = Math.max(
    0,
    quantidadeDeDiasRestantes - 1,
  );
  const limiteDiasFuturos =
    quantidadeDeDiasFuturos === 0
      ? null
      : Math.floor(
          (valorDisponivel - restanteHoje) /
            quantidadeDeDiasFuturos,
        );

  return {
    valorDisponivel,
    limiteDiario: limitePlanejadoHoje,
    quantidadeDeDiasRestantes,
    totalGastosRegistrados,
    totalGastosHoje,
    limitePlanejadoHoje,
    restanteHoje,
    excedenteHoje,
    quantidadeDeDiasFuturos,
    limiteDiasFuturos,
  };
}

export function criarGeradorDeterministico(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
