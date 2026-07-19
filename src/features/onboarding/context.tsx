import { createContext, type PropsWithChildren, useContext, useMemo, useReducer } from 'react';

import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';
import {
  registrarGasto as executarRegistroGasto,
  type RegistroGastoConcluido,
} from '../expenses';
import { obterDataCivilHoje } from './model';

interface EstadoOnboarding {
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
  definirConfiguracao: (configuracao: EntradaCalculoDiario) => void;
  confirmarConfiguracao: () => ResultadoCalculoDiario;
  registrarGasto: (valor: string, dataAtual?: string) => RegistroGastoConcluido;
}

const ContextoOnboarding = createContext<EstadoOnboarding | null>(null);

interface PlanejamentoEmMemoria {
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
}

type AcaoPlanejamento =
  | { tipo: 'CONFIGURAR'; configuracao: EntradaCalculoDiario }
  | { tipo: 'ATUALIZAR_PLANO'; planejamento: RegistroGastoConcluido };

function reduzirPlanejamento(
  estado: PlanejamentoEmMemoria,
  acao: AcaoPlanejamento,
): PlanejamentoEmMemoria {
  if (acao.tipo === 'CONFIGURAR') {
    return { configuracao: acao.configuracao, resultado: null };
  }

  return acao.planejamento;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [estado, dispatch] = useReducer(reduzirPlanejamento, {
    configuracao: null,
    resultado: null,
  });

  const valor = useMemo<EstadoOnboarding>(
    () => ({
      configuracao: estado.configuracao,
      resultado: estado.resultado,
      definirConfiguracao: (novaConfiguracao) => {
        dispatch({ tipo: 'CONFIGURAR', configuracao: novaConfiguracao });
      },
      confirmarConfiguracao: () => {
        if (!estado.configuracao) {
          throw new Error('A configuração inicial ainda não foi preenchida.');
        }

        const novoResultado = calcularPlanoDiario(estado.configuracao);
        dispatch({
          tipo: 'ATUALIZAR_PLANO',
          planejamento: {
            configuracao: estado.configuracao,
            resultado: novoResultado,
          },
        });
        return novoResultado;
      },
      registrarGasto: (valorGasto, dataAtual = obterDataCivilHoje()) => {
        if (!estado.configuracao || !estado.resultado) {
          throw new Error('O planejamento precisa estar confirmado antes de registrar um gasto.');
        }

        const planejamento = executarRegistroGasto(
          estado.configuracao,
          valorGasto,
          dataAtual,
        );
        dispatch({ tipo: 'ATUALIZAR_PLANO', planejamento });
        return planejamento;
      },
    }),
    [estado],
  );

  return <ContextoOnboarding.Provider value={valor}>{children}</ContextoOnboarding.Provider>;
}

export function useOnboarding(): EstadoOnboarding {
  const contexto = useContext(ContextoOnboarding);

  if (!contexto) {
    throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider.');
  }

  return contexto;
}
