import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ESTADO_TUTORIAL_PADRAO,
  type EstadoTutorialV1,
} from './model';
import {
  armazenamentoTutorial,
  type ArmazenamentoTutorial,
} from './storage';

export interface TutorialContextValue {
  ready: boolean;
  state: EstadoTutorialV1;
  completeIntroduction(): Promise<void>;
  completeHomeTour(): Promise<void>;
  resetHomeTour(): Promise<void>;
  markContextualTipSeen(id: string): Promise<void>;
  hasSeenContextualTip(id: string): boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

interface TutorialProviderProps extends PropsWithChildren {
  armazenamento?: ArmazenamentoTutorial;
}

export function TutorialProvider({
  children,
  armazenamento = armazenamentoTutorial,
}: TutorialProviderProps) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<EstadoTutorialV1>(
    ESTADO_TUTORIAL_PADRAO,
  );
  const mounted = useRef(true);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mounted.current = true;
    void armazenamento
      .carregar()
      .then((restaurado) => {
        if (mounted.current) setState(restaurado);
      })
      .catch(() => {
        if (mounted.current) setState(ESTADO_TUTORIAL_PADRAO);
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, [armazenamento]);

  const persistir = useCallback(
    async (proximo: EstadoTutorialV1) => {
      stateRef.current = proximo;
      if (mounted.current) setState(proximo);
      await armazenamento.salvar(proximo);
    },
    [armazenamento],
  );

  const completeIntroduction = useCallback(async () => {
    const atual = stateRef.current;
    if (atual.apresentacaoConcluida) return;
    await persistir({ ...atual, apresentacaoConcluida: true });
  }, [persistir]);

  const completeHomeTour = useCallback(async () => {
    const atual = stateRef.current;
    if (atual.tourHomeConcluido) return;
    await persistir({ ...atual, tourHomeConcluido: true });
  }, [persistir]);

  const resetHomeTour = useCallback(async () => {
    const atual = stateRef.current;
    if (!atual.tourHomeConcluido) return;
    await persistir({ ...atual, tourHomeConcluido: false });
  }, [persistir]);

  const markContextualTipSeen = useCallback(
    async (id: string) => {
      const normalizado = id.trim();
      if (!normalizado) return;
      const atual = stateRef.current;
      if (atual.dicasContextuaisVistas.includes(normalizado)) return;
      await persistir({
        ...atual,
        dicasContextuaisVistas: [
          ...atual.dicasContextuaisVistas,
          normalizado,
        ],
      });
    },
    [persistir],
  );

  const value = useMemo<TutorialContextValue>(
    () => ({
      ready,
      state,
      completeIntroduction,
      completeHomeTour,
      resetHomeTour,
      markContextualTipSeen,
      hasSeenContextualTip: (id) =>
        state.dicasContextuaisVistas.includes(id),
    }),
    [
      completeHomeTour,
      completeIntroduction,
      markContextualTipSeen,
      ready,
      resetHomeTour,
      state,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const value = useContext(TutorialContext);
  if (!value) {
    throw new Error('useTutorial deve ser usado dentro de TutorialProvider.');
  }
  return value;
}

