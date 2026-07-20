export const VERSAO_TUTORIAL = 1 as const;
export const DICA_NOVO_RECEBIMENTO = 'novo-recebimento';

export interface EstadoTutorialV1 {
  versao: typeof VERSAO_TUTORIAL;
  apresentacaoConcluida: boolean;
  tourHomeConcluido: boolean;
  dicasContextuaisVistas: readonly string[];
}

export const ESTADO_TUTORIAL_PADRAO: EstadoTutorialV1 = {
  versao: VERSAO_TUTORIAL,
  apresentacaoConcluida: false,
  tourHomeConcluido: false,
  dicasContextuaisVistas: [],
};

export class ErroEstadoTutorial extends Error {
  constructor(mensagem = 'Os dados educativos armazenados são inválidos.') {
    super(mensagem);
    this.name = 'ErroEstadoTutorial';
  }
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function validarEstadoTutorial(valor: unknown): EstadoTutorialV1 {
  if (!ehObjeto(valor) || valor.versao !== VERSAO_TUTORIAL) {
    throw new ErroEstadoTutorial();
  }
  if (
    typeof valor.apresentacaoConcluida !== 'boolean' ||
    typeof valor.tourHomeConcluido !== 'boolean' ||
    !Array.isArray(valor.dicasContextuaisVistas)
  ) {
    throw new ErroEstadoTutorial();
  }

  const dicas = valor.dicasContextuaisVistas;
  if (
    dicas.some((item) => typeof item !== 'string' || item.trim().length === 0)
  ) {
    throw new ErroEstadoTutorial();
  }
  const normalizadas = dicas.map((item) => item.trim());
  if (new Set(normalizadas).size !== normalizadas.length) {
    throw new ErroEstadoTutorial('As dicas educativas possuem IDs duplicados.');
  }

  return {
    versao: VERSAO_TUTORIAL,
    apresentacaoConcluida: valor.apresentacaoConcluida,
    tourHomeConcluido: valor.tourHomeConcluido,
    dicasContextuaisVistas: normalizadas,
  };
}

export type StatusRotaInicial =
  | 'carregando'
  | 'vazio'
  | 'editando'
  | 'pronto'
  | 'expirado'
  | 'erro';

export type DestinoInicial =
  | 'carregando'
  | 'recuperacao'
  | '/home'
  | '/apresentacao'
  | '/onboarding';

export function resolverDestinoInicial(
  status: StatusRotaInicial,
  apresentacaoConcluida: boolean,
): DestinoInicial {
  if (status === 'carregando') return 'carregando';
  if (status === 'erro' || status === 'expirado') return 'recuperacao';
  if (status === 'pronto') return '/home';
  return apresentacaoConcluida ? '/onboarding' : '/apresentacao';
}

export interface PassoApresentacao {
  eyebrow: string;
  title: string;
  description: string;
  complement?: string;
}

export const PASSOS_APRESENTACAO: readonly PassoApresentacao[] = [
  {
    eyebrow: 'BEM-VINDO',
    title: 'Seu dinheiro até o próximo recebimento',
    description:
      'O Saldo do Dia mostra quanto você pode gastar hoje sem comprometer o restante do seu ciclo.',
    complement: 'Sem planilhas e sem cálculos complicados.',
  },
  {
    eyebrow: 'COMO FUNCIONA',
    title: 'Um planejamento que se ajusta',
    description:
      'Informe seu saldo, contas pendentes, reserva e a data do próximo recebimento. O aplicativo calcula um limite diário e se ajusta quando você registra um gasto.',
  },
  {
    eyebrow: 'PRIVACIDADE NESTA VERSÃO',
    title: 'Seus dados ficam no aparelho',
    description:
      'Atualmente, suas informações ficam somente neste aparelho. Conta, sincronização e armazenamento em nuvem ainda não estão disponíveis nesta versão.',
  },
] as const;

export interface PassoTourHome {
  target: 'limite' | 'registrar' | 'historico' | 'detalhes';
  title: string;
  description: string;
}

export const PASSOS_TOUR_HOME: readonly PassoTourHome[] = [
  {
    target: 'limite',
    title: 'Seu limite de hoje',
    description:
      'Este é o valor que você pode gastar hoje sem comprometer os próximos dias do ciclo.',
  },
  {
    target: 'registrar',
    title: 'Mantenha o cálculo atualizado',
    description:
      'Registre seus gastos para recalcular automaticamente o saldo e o limite dos próximos dias.',
  },
  {
    target: 'historico',
    title: 'Revise seus registros',
    description:
      'No histórico do ciclo atual, você pode consultar, editar ou excluir seus gastos.',
  },
  {
    target: 'detalhes',
    title: 'Entenda o cálculo',
    description:
      'Abra os detalhes quando quiser consultar saldo, contas, reserva, gastos e próximos dias.',
  },
] as const;

