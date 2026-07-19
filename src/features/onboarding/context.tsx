import {
  AppState,
  type AppStateStatus,
} from 'react-native';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import type {
  EntradaCalculoDiario,
  ResultadoCalculoDiario,
} from '../daily-limit';
import type { RegistroGastoConcluido } from '../expenses';
import {
  armazenamentoPlanejamento,
  atualizarPlanejamentoParaData,
  confirmarPlanejamentoPersistido,
  hidratarPlanejamento,
  registrarGastoPersistido,
  type ArmazenamentoPlanejamento,
  type EstadoRestauracaoPlanejamento,
} from '../../storage';
import { obterDataCivilHoje } from './model';

export type StatusPlanejamento =
  | 'carregando'
  | 'vazio'
  | 'editando'
  | 'pronto'
  | 'expirado'
  | 'erro';

export interface FalhaHidratacao {
  origem: 'leitura' | 'dados-corrompidos' | 'gravacao';
  mensagem: string;
}

interface EstadoOnboarding {
  status: StatusPlanejamento;
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
  falhaHidratacao: FalhaHidratacao | null;
  definirConfiguracao: (configuracao: EntradaCalculoDiario) => void;
  confirmarConfiguracao: () => Promise<ResultadoCalculoDiario>;
  registrarGasto: (
    valor: string,
    dataAtual?: string,
  ) => Promise<RegistroGastoConcluido>;
  tentarHidratar: () => Promise<void>;
  recomecarPlanejamento: () => Promise<void>;
}

const ContextoOnboarding = createContext<EstadoOnboarding | null>(null);

interface PlanejamentoEmMemoria {
  status: StatusPlanejamento;
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
  falhaHidratacao: FalhaHidratacao | null;
}

type AcaoPlanejamento =
  | { tipo: 'CARREGAR' }
  | { tipo: 'VAZIO' }
  | { tipo: 'CONFIGURAR'; configuracao: EntradaCalculoDiario }
  | {
      tipo: 'PRONTO';
      configuracao: EntradaCalculoDiario;
      resultado: ResultadoCalculoDiario;
    }
  | { tipo: 'EXPIRADO'; configuracao: EntradaCalculoDiario }
  | {
      tipo: 'ERRO';
      falha: FalhaHidratacao;
      preservarPlanejamento?: boolean;
    };

const ESTADO_INICIAL: PlanejamentoEmMemoria = {
  status: 'carregando',
  configuracao: null,
  resultado: null,
  falhaHidratacao: null,
};

function reduzirPlanejamento(
  estado: PlanejamentoEmMemoria,
  acao: AcaoPlanejamento,
): PlanejamentoEmMemoria {
  switch (acao.tipo) {
    case 'CARREGAR':
      return { ...estado, status: 'carregando', falhaHidratacao: null };
    case 'VAZIO':
      return { ...ESTADO_INICIAL, status: 'vazio' };
    case 'CONFIGURAR':
      return {
        status: 'editando',
        configuracao: acao.configuracao,
        resultado: null,
        falhaHidratacao: null,
      };
    case 'PRONTO':
      return {
        status: 'pronto',
        configuracao: acao.configuracao,
        resultado: acao.resultado,
        falhaHidratacao: null,
      };
    case 'EXPIRADO':
      return {
        status: 'expirado',
        configuracao: acao.configuracao,
        resultado: null,
        falhaHidratacao: null,
      };
    case 'ERRO':
      return {
        status: 'erro',
        configuracao: acao.preservarPlanejamento ? estado.configuracao : null,
        resultado: acao.preservarPlanejamento ? estado.resultado : null,
        falhaHidratacao: acao.falha,
      };
  }
}

function criarAcaoRestauracao(
  estado: EstadoRestauracaoPlanejamento,
): AcaoPlanejamento {
  switch (estado.tipo) {
    case 'vazio':
      return { tipo: 'VAZIO' };
    case 'pronto':
      return {
        tipo: 'PRONTO',
        configuracao: estado.configuracao,
        resultado: estado.resultado,
      };
    case 'expirado':
      return { tipo: 'EXPIRADO', configuracao: estado.configuracao };
    case 'erro':
      return {
        tipo: 'ERRO',
        falha: { origem: estado.origem, mensagem: estado.mensagem },
      };
  }
}

interface OnboardingProviderProps extends PropsWithChildren {
  armazenamento?: ArmazenamentoPlanejamento;
}

export function OnboardingProvider({
  children,
  armazenamento = armazenamentoPlanejamento,
}: OnboardingProviderProps) {
  const [estado, dispatch] = useReducer(reduzirPlanejamento, ESTADO_INICIAL);
  const estadoAtual = useRef(estado);
  const atualizandoData = useRef(false);

  useEffect(() => {
    estadoAtual.current = estado;
  }, [estado]);

  const tentarHidratar = useCallback(async () => {
    dispatch({ tipo: 'CARREGAR' });
    const restauracao = await hidratarPlanejamento(
      armazenamento,
      obterDataCivilHoje(),
    );
    dispatch(criarAcaoRestauracao(restauracao));
  }, [armazenamento]);

  useEffect(() => {
    void tentarHidratar();
  }, [tentarHidratar]);

  useEffect(() => {
    async function tratarMudancaDeEstado(proximoEstado: AppStateStatus) {
      const atual = estadoAtual.current;
      if (
        proximoEstado !== 'active' ||
        atualizandoData.current ||
        !atual.configuracao ||
        (atual.status !== 'pronto' && atual.status !== 'expirado')
      ) {
        return;
      }

      const hoje = obterDataCivilHoje();
      if (atual.configuracao.dataAtual === hoje) {
        return;
      }

      atualizandoData.current = true;
      try {
        const restauracao = await atualizarPlanejamentoParaData(
          armazenamento,
          atual.configuracao,
          hoje,
        );
        if (restauracao.tipo === 'erro') {
          dispatch({
            tipo: 'ERRO',
            falha: {
              origem: restauracao.origem,
              mensagem: restauracao.mensagem,
            },
            preservarPlanejamento: true,
          });
        } else {
          dispatch(criarAcaoRestauracao(restauracao));
        }
      } finally {
        atualizandoData.current = false;
      }
    }

    const assinatura = AppState.addEventListener('change', (proximoEstado) => {
      void tratarMudancaDeEstado(proximoEstado);
    });
    return () => assinatura.remove();
  }, [armazenamento]);

  const valor = useMemo<EstadoOnboarding>(
    () => ({
      status: estado.status,
      configuracao: estado.configuracao,
      resultado: estado.resultado,
      falhaHidratacao: estado.falhaHidratacao,
      definirConfiguracao: (novaConfiguracao) => {
        dispatch({ tipo: 'CONFIGURAR', configuracao: novaConfiguracao });
      },
      confirmarConfiguracao: async () => {
        if (!estado.configuracao) {
          throw new Error('A configuração inicial ainda não foi preenchida.');
        }

        const planejamento = await confirmarPlanejamentoPersistido(
          armazenamento,
          estado.configuracao,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
        });
        return planejamento.resultado;
      },
      registrarGasto: async (valorGasto, dataAtual = obterDataCivilHoje()) => {
        if (!estado.configuracao || !estado.resultado || estado.status !== 'pronto') {
          throw new Error('O planejamento precisa estar disponível para registrar um gasto.');
        }

        const planejamento = await registrarGastoPersistido(
          armazenamento,
          estado.configuracao,
          valorGasto,
          dataAtual,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
        });
        return planejamento;
      },
      tentarHidratar,
      recomecarPlanejamento: async () => {
        await armazenamento.remover();
        dispatch({ tipo: 'VAZIO' });
      },
    }),
    [armazenamento, estado, tentarHidratar],
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
