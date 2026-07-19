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
import type { CicloEncerrado, DadosPlanejamento } from '../cycle-history/model';
import { gerarUuidCiclo } from '../cycle-history/cycle-id';
import {
  type EdicaoGastoConcluida,
  type ExclusaoGastoConcluida,
  type RegistroGastoConcluido,
  type DadosFormularioGasto,
} from '../expenses';
import { gerarUuidGasto } from '../expenses/expense-id';
import type {
  DadosFormularioNovoCiclo,
  NovoCicloCriado,
} from '../cycle';
import {
  armazenamentoPlanejamento,
  atualizarPlanejamentoParaData,
  confirmarPlanejamentoPersistido,
  editarGastoPersistido,
  excluirGastoPersistido,
  hidratarPlanejamento,
  iniciarNovoCicloPersistido,
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
  rascunhoNovoCiclo: DadosFormularioNovoCiclo | null;
  ciclosEncerrados: readonly CicloEncerrado[];
  definirConfiguracao: (configuracao: EntradaCalculoDiario) => void;
  confirmarConfiguracao: () => Promise<ResultadoCalculoDiario>;
  registrarGasto: (
    dados: DadosFormularioGasto,
    dataAtual?: string,
  ) => Promise<RegistroGastoConcluido>;
  editarGasto: (
    id: string,
    dados: DadosFormularioGasto,
    dataAtual?: string,
  ) => Promise<EdicaoGastoConcluida>;
  excluirGasto: (
    id: string,
    dataAtual?: string,
  ) => Promise<ExclusaoGastoConcluida>;
  prepararNovoCiclo: (dados: DadosFormularioNovoCiclo) => void;
  cancelarNovoCiclo: () => void;
  iniciarNovoCiclo: (
    dataAtual?: string,
  ) => Promise<NovoCicloCriado>;
  tentarHidratar: () => Promise<void>;
  recomecarPlanejamento: () => Promise<void>;
}

const ContextoOnboarding = createContext<EstadoOnboarding | null>(null);

interface PlanejamentoEmMemoria {
  status: StatusPlanejamento;
  configuracao: EntradaCalculoDiario | null;
  resultado: ResultadoCalculoDiario | null;
  dados: DadosPlanejamento | null;
  falhaHidratacao: FalhaHidratacao | null;
  rascunhoNovoCiclo: DadosFormularioNovoCiclo | null;
}

type AcaoPlanejamento =
  | { tipo: 'CARREGAR' }
  | { tipo: 'VAZIO' }
  | { tipo: 'CONFIGURAR'; configuracao: EntradaCalculoDiario }
  | {
      tipo: 'PRONTO';
      configuracao: EntradaCalculoDiario;
      resultado: ResultadoCalculoDiario;
      dados: DadosPlanejamento;
    }
  | { tipo: 'EXPIRADO'; configuracao: EntradaCalculoDiario; dados: DadosPlanejamento }
  | { tipo: 'PREPARAR_NOVO_CICLO'; dados: DadosFormularioNovoCiclo }
  | { tipo: 'CANCELAR_NOVO_CICLO' }
  | {
      tipo: 'ERRO';
      falha: FalhaHidratacao;
      preservarPlanejamento?: boolean;
    };

const ESTADO_INICIAL: PlanejamentoEmMemoria = {
  status: 'carregando',
  configuracao: null,
  resultado: null,
  dados: null,
  falhaHidratacao: null,
  rascunhoNovoCiclo: null,
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
        dados: estado.dados,
        falhaHidratacao: null,
        rascunhoNovoCiclo: null,
      };
    case 'PRONTO':
      return {
        status: 'pronto',
        configuracao: acao.configuracao,
        resultado: acao.resultado,
        dados: acao.dados,
        falhaHidratacao: null,
        rascunhoNovoCiclo: null,
      };
    case 'EXPIRADO':
      return {
        status: 'expirado',
        configuracao: acao.configuracao,
        resultado: null,
        dados: acao.dados,
        falhaHidratacao: null,
        rascunhoNovoCiclo: estado.rascunhoNovoCiclo,
      };
    case 'PREPARAR_NOVO_CICLO':
      return { ...estado, rascunhoNovoCiclo: acao.dados };
    case 'CANCELAR_NOVO_CICLO':
      return { ...estado, rascunhoNovoCiclo: null };
    case 'ERRO':
      return {
        status: 'erro',
        configuracao: acao.preservarPlanejamento ? estado.configuracao : null,
        resultado: acao.preservarPlanejamento ? estado.resultado : null,
        dados: acao.preservarPlanejamento ? estado.dados : null,
        falhaHidratacao: acao.falha,
        rascunhoNovoCiclo: estado.rascunhoNovoCiclo,
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
        dados: estado.dados,
      };
    case 'expirado':
      return { tipo: 'EXPIRADO', configuracao: estado.configuracao, dados: estado.dados };
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
          atual.dados!,
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
      ciclosEncerrados: estado.dados?.ciclosEncerrados ?? [],
      falhaHidratacao: estado.falhaHidratacao,
      rascunhoNovoCiclo: estado.rascunhoNovoCiclo,
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
          estado.dados,
          gerarUuidCiclo,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
          dados: planejamento.dados,
        });
        return planejamento.resultado;
      },
      registrarGasto: async (dadosGasto, dataAtual = obterDataCivilHoje()) => {
        if (!estado.dados || !estado.resultado || estado.status !== 'pronto') {
          throw new Error('O planejamento precisa estar disponível para registrar um gasto.');
        }

        const planejamento = await registrarGastoPersistido(
          armazenamento,
          estado.dados,
          dadosGasto,
          dataAtual,
          gerarUuidGasto,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
          dados: planejamento.dados,
        });
        return planejamento;
      },
      editarGasto: async (
        id,
        dadosGasto,
        dataAtual = obterDataCivilHoje(),
      ) => {
        if (!estado.dados || !estado.resultado || estado.status !== 'pronto') {
          throw new Error('O planejamento precisa estar disponível para editar um gasto.');
        }

        const planejamento = await editarGastoPersistido(
          armazenamento,
          estado.dados,
          id,
          dadosGasto,
          dataAtual,
        );
        if (planejamento.alterado) {
          dispatch({
            tipo: 'PRONTO',
            configuracao: planejamento.configuracao,
            resultado: planejamento.resultado,
            dados: planejamento.dados,
          });
        }
        return planejamento;
      },
      excluirGasto: async (id, dataAtual = obterDataCivilHoje()) => {
        if (!estado.dados || !estado.resultado || estado.status !== 'pronto') {
          throw new Error('O planejamento precisa estar disponível para excluir um gasto.');
        }

        const planejamento = await excluirGastoPersistido(
          armazenamento,
          estado.dados,
          id,
          dataAtual,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
          dados: planejamento.dados,
        });
        return planejamento;
      },
      prepararNovoCiclo: (dados) => {
        dispatch({ tipo: 'PREPARAR_NOVO_CICLO', dados });
      },
      cancelarNovoCiclo: () => {
        dispatch({ tipo: 'CANCELAR_NOVO_CICLO' });
      },
      iniciarNovoCiclo: async (dataAtual = obterDataCivilHoje()) => {
        if (!estado.dados || !estado.rascunhoNovoCiclo) {
          throw new Error('Preencha e revise os dados do novo ciclo primeiro.');
        }

        const planejamento = await iniciarNovoCicloPersistido(
          armazenamento,
          estado.dados,
          estado.rascunhoNovoCiclo,
          dataAtual,
          gerarUuidCiclo,
        );
        dispatch({
          tipo: 'PRONTO',
          configuracao: planejamento.configuracao,
          resultado: planejamento.resultado,
          dados: planejamento.dados,
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
