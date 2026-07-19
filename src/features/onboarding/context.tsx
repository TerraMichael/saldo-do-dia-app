import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import {
  calcularPlanoDiario,
  type EntradaCalculoDiario,
  type ResultadoCalculoDiario,
} from '../daily-limit';

interface EstadoOnboarding {
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
  definirConfiguracao: (configuracao: EntradaCalculoDiario) => void;
  confirmarConfiguracao: () => ResultadoCalculoDiario;
}

const ContextoOnboarding = createContext<EstadoOnboarding | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [configuracao, setConfiguracao] = useState<EntradaCalculoDiario | null>(null);
  const [resultado, setResultado] = useState<ResultadoCalculoDiario | null>(null);

  const valor = useMemo<EstadoOnboarding>(
    () => ({
      configuracao,
      resultado,
      definirConfiguracao: (novaConfiguracao) => {
        setConfiguracao(novaConfiguracao);
        setResultado(null);
      },
      confirmarConfiguracao: () => {
        if (!configuracao) {
          throw new Error('A configuração inicial ainda não foi preenchida.');
        }

        const novoResultado = calcularPlanoDiario(configuracao);
        setResultado(novoResultado);
        return novoResultado;
      },
    }),
    [configuracao, resultado],
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
