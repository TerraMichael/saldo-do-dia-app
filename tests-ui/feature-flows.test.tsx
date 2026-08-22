import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { calcularPlanoDiario, type EntradaCalculoDiario } from '../src/features/daily-limit';
import { EditExpenseScreen } from '../src/features/expenses/components/EditExpenseScreen';
import { ExpenseForm } from '../src/features/expenses/components/ExpenseForm';
import { registrarGasto as registrarGastoNoDominio } from '../src/features/expenses';
import { HistoryScreen } from '../src/features/history/components/HistoryScreen';
import { HomeScreen } from '../src/features/home/components/HomeScreen';
import { NewCycleReview } from '../src/features/cycle/components/NewCycleReview';
import { NewCycleForm } from '../src/features/cycle/components/NewCycleForm';
import { OnboardingForm } from '../src/features/onboarding/components/OnboardingForm';
import { OnboardingReview } from '../src/features/onboarding/components/OnboardingReview';
import * as onboarding from '../src/features/onboarding';
import { IntroductionScreen } from '../src/features/tutorial/components/IntroductionScreen';
import { HomeTour } from '../src/features/tutorial/components/HomeTour';
import { NewCycleTip } from '../src/features/tutorial/components/NewCycleTip';
import * as tutorial from '../src/features/tutorial';
import { SettingsScreen } from '../src/features/settings/components/SettingsScreen';
import { deferred, renderFeature, routerMock as mockRouter } from './support/test-harness';

let mockOnboardingValue: ReturnType<typeof onboarding.useOnboarding>;
let mockTutorialValue: ReturnType<typeof tutorial.useTutorial>;

jest.mock('../src/features/onboarding/context', () => ({
  ...jest.requireActual('../src/features/onboarding/context'),
  useOnboarding: () => mockOnboardingValue,
}));

jest.mock('../src/features/tutorial/context', () => ({
  ...jest.requireActual('../src/features/tutorial/context'),
  useTutorial: () => mockTutorialValue,
}));

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));

jest.mock('../src/storage/appearance-storage', () => ({
  armazenamentoAparencia: {
    carregar: jest.fn(async () => 'sistema'),
    salvar: jest.fn(async () => undefined),
  },
  carregarAparenciaComFallback: jest.fn(
    () => new Promise<never>(() => undefined),
  ),
}));

const mockSaveAppearance = jest.requireMock(
  '../src/storage/appearance-storage',
).armazenamentoAparencia.salvar as jest.Mock;

jest.mock('../src/shared/app-release', () => ({
  getAppReleaseInfo: () => ({
    version: '1.0.0',
    release: '1',
    productName: 'Saldo do Dia',
    publisherName: 'Leahcim',
    accessibilityLabel:
      'Saldo do Dia. Versão 1.0.0. Release 1. Powered by Leahcim.',
  }),
}));

const configuracaoBase: EntradaCalculoDiario = {
  saldoAtual: 100_000,
  reserva: 10_000,
  contasPendentes: 20_000,
  dataAtual: '2026-07-25',
  dataProximoRecebimento: '2026-08-03',
  gastosRegistrados: [],
};

function contexto(overrides: Record<string, unknown> = {}) {
  const configuracao = (overrides.configuracao ??
    configuracaoBase) as EntradaCalculoDiario | null;
  return {
    status: 'pronto',
    configuracao,
    resultado: configuracao ? calcularPlanoDiario(configuracao) : null,
    falhaHidratacao: null,
    rascunhoNovoCiclo: null,
    ciclosEncerrados: [],
    definirConfiguracao: jest.fn(),
    confirmarConfiguracao: jest.fn(async () => calcularPlanoDiario(configuracaoBase)),
    registrarGasto: jest.fn(async () => ({ configuracao: configuracaoBase, resultado: calcularPlanoDiario(configuracaoBase) })),
    editarGasto: jest.fn(async () => ({ alterado: true, configuracao: configuracaoBase, resultado: calcularPlanoDiario(configuracaoBase) })),
    excluirGasto: jest.fn(async () => ({ configuracao: configuracaoBase, resultado: calcularPlanoDiario(configuracaoBase) })),
    prepararNovoCiclo: jest.fn(),
    cancelarNovoCiclo: jest.fn(),
    iniciarNovoCiclo: jest.fn(async () => ({})),
    tentarHidratar: jest.fn(async () => undefined),
    recomecarPlanejamento: jest.fn(async () => undefined),
    ...overrides,
  } as ReturnType<typeof onboarding.useOnboarding>;
}

function tutorialContext(overrides: Partial<ReturnType<typeof tutorial.useTutorial>> = {}) {
  return {
    ready: true,
    state: {
      versao: 1 as const,
      apresentacaoConcluida: false,
      tourHomeConcluido: true,
      dicasContextuaisVistas: [],
    },
    completeIntroduction: jest.fn(async () => undefined),
    completeHomeTour: jest.fn(async () => undefined),
    resetHomeTour: jest.fn(async () => undefined),
    markContextualTipSeen: jest.fn(async () => undefined),
    hasSeenContextualTip: jest.fn(() => false),
    ...overrides,
  };
}

function InteractiveTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  return (
    <HomeTour
      onBack={() => setStep((current) => Math.max(0, current - 1))}
      onClose={onClose}
      onNext={() => setStep((current) => Math.min(3, current + 1))}
      onRequestScroll={jest.fn()}
      step={step}
      targetMeasurementRevision={step}
      targetRect={{ x: 20, y: 80, width: 320, height: 60 }}
    />
  );
}

function layoutTourPanel() {
  const measurement = screen
    .UNSAFE_getAllByType(View)
    .find((node) => node.props.pointerEvents === 'none' && node.props.onLayout);
  if (!measurement) throw new Error('Painel de medição do tour não encontrado.');
  fireEvent(measurement, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 358, height: 280 } },
  });
}

beforeEach(() => {
  mockOnboardingValue = contexto();
  mockTutorialValue = tutorialContext();
  mockSaveAppearance.mockResolvedValue(undefined);
});

describe('apresentação e onboarding reais', () => {
  test('apresentação avança, retorna e conclui antes de navegar', async () => {
    const completion = deferred<void>();
    const completeIntroduction = jest.fn(() => completion.promise);
    mockTutorialValue = tutorialContext({ completeIntroduction });
    renderFeature(<IntroductionScreen />);
    expect(screen.getByLabelText('Passo 1 de 3')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('Passo 2 de 3')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByLabelText('Passo 1 de 3')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Pular apresentação' }));
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => completion.resolve());
    expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding');
  });

  test('formulário mostra os quatro campos, ajudas e rejeita negativos', () => {
    renderFeature(<OnboardingForm />);
    expect(screen.getByLabelText('Saldo atual')).toBeTruthy();
    expect(screen.getByLabelText('Total de contas pendentes')).toBeTruthy();
    expect(screen.getByLabelText('Valor que deseja reservar')).toBeTruthy();
    expect(screen.getByText('A data em que você espera receber novamente.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Saldo atual'), '1000');
    fireEvent.changeText(screen.getByLabelText('Total de contas pendentes'), '-1');
    fireEvent.press(screen.getByRole('button', { name: 'Revisar dados' }));
    expect(screen.getByText(/contas pendentes não pode ser negativo/i)).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('formulário rejeita reserva negativa e data anterior', () => {
    (globalThis as { __mockDatePickerDate?: Date }).__mockDatePickerDate =
      new Date(2020, 0, 1);
    renderFeature(<OnboardingForm />);
    fireEvent.changeText(screen.getByLabelText('Saldo atual'), '1000');
    fireEvent.changeText(screen.getByLabelText('Valor que deseja reservar'), '-1');
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Selecionar data do próximo recebimento',
      }),
    );
    fireEvent.press(screen.getByLabelText('Confirmar data no seletor'));
    fireEvent.press(screen.getByRole('button', { name: 'Revisar dados' }));
    expect(screen.getByText(/reserva não pode ser negativo/i)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Valor que deseja reservar'), '0');
    fireEvent.press(screen.getByRole('button', { name: 'Revisar dados' }));
    expect(
      screen.getByText(/deve ser hoje ou uma data futura/i),
    ).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('formulário válido publica rascunho uma vez e abre revisão', () => {
    (globalThis as { __mockDatePickerDate?: Date }).__mockDatePickerDate =
      new Date(2099, 0, 2);
    renderFeature(<OnboardingForm />);
    fireEvent.changeText(screen.getByLabelText('Saldo atual'), '1000');
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Selecionar data do próximo recebimento',
      }),
    );
    fireEvent.press(screen.getByLabelText('Confirmar data no seletor'));
    fireEvent.press(screen.getByRole('button', { name: 'Revisar dados' }));
    expect(mockOnboardingValue.definirConfiguracao).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/revisao');
  });

  test('saldo inválido impede revisão e mantém os dados do formulário', () => {
    renderFeature(<OnboardingForm />);
    fireEvent.changeText(screen.getByLabelText('Saldo atual'), 'valor inválido');
    fireEvent.press(screen.getByRole('button', { name: 'Revisar dados' }));
    expect(screen.getByText(/Informe um valor válido/i)).toBeTruthy();
    expect(screen.getByDisplayValue('valor inválido')).toBeTruthy();
    expect(mockOnboardingValue.definirConfiguracao).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('revisão bloqueia duplo toque e navega só após persistência', async () => {
    const persistence = deferred<ReturnType<typeof calcularPlanoDiario>>();
    const confirmarConfiguracao = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({ confirmarConfiguracao });
    renderFeature(<OnboardingReview />);
    const button = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(confirmarConfiguracao).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => persistence.resolve(calcularPlanoDiario(configuracaoBase)));
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  test('falha de persistência preserva revisão e permite tentar novamente', async () => {
    const confirmarConfiguracao = jest
      .fn()
      .mockRejectedValueOnce(new Error('Falha ao salvar'))
      .mockResolvedValueOnce(calcularPlanoDiario(configuracaoBase));
    mockOnboardingValue = contexto({ confirmarConfiguracao });
    renderFeature(<OnboardingReview />);
    fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('Falha ao salvar')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
  });
});

describe('Home real', () => {
  test('estado positivo mantém foco e ações principais', () => {
    renderFeature(<HomeScreen />);
    expect(screen.getByText('Você ainda pode gastar hoje')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Registrar gasto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver histórico' })).toBeTruthy();
  });

  test('detalhes começam recolhidos, expandem e recolhem', () => {
    renderFeature(<HomeScreen />);
    const expand = screen.getByRole('button', { name: /Expandir detalhes do planejamento/i });
    expect(screen.queryByText('Saldo atual')).toBeNull();
    fireEvent.press(expand);
    expect(screen.getByText('Saldo atual')).toBeTruthy();
    expect(screen.getByText('Disponível para gastos')).toBeTruthy();
    expect(screen.getByText('Contas pendentes')).toBeTruthy();
    expect(screen.getByText('Reserva protegida')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Recolher detalhes do planejamento/i }));
    expect(screen.queryByText('Saldo atual')).toBeNull();
  });

  test('ações navegam uma única vez para gasto, histórico, configurações e novo recebimento', () => {
    renderFeature(<HomeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    fireEvent.press(screen.getByRole('button', { name: 'Ver histórico' }));
    fireEvent.press(screen.getByRole('button', { name: 'Abrir configurações' }));
    fireEvent.press(screen.getByRole('button', { name: /Expandir detalhes do planejamento/i }));
    fireEvent.press(screen.getByRole('button', { name: 'Novo recebimento' }));
    expect(mockRouter.push).toHaveBeenCalledTimes(4);
    expect(mockRouter.push).toHaveBeenCalledWith('/novo-ciclo');
  });

  test('loading não mostra Home parcialmente pronta', () => {
    mockOnboardingValue = contexto({
      status: 'carregando',
      configuracao: null,
      resultado: null,
    });
    renderFeature(<HomeScreen />);
    expect(screen.getByText('Carregando seu planejamento')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Registrar gasto' })).toBeNull();
  });

  test('erro oferece retry único sem expor a Home', async () => {
    const tentarHidratar = jest.fn(async () => undefined);
    mockOnboardingValue = contexto({
      status: 'erro',
      configuracao: null,
      resultado: null,
      falhaHidratacao: { origem: 'leitura', mensagem: 'Falha de leitura' },
      tentarHidratar,
    });
    renderFeature(<HomeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(tentarHidratar).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Você ainda pode gastar hoje')).toBeNull();
  });

  test('déficit permanece explícito e valor gastável não fica negativo', () => {
    const configuracao = { ...configuracaoBase, saldoAtual: -1000 };
    mockOnboardingValue = contexto({ configuracao });
    renderFeature(<HomeScreen />);
    expect(screen.getByText(/Déficit:/)).toBeTruthy();
    expect(screen.getByText('R$ 0,00')).toBeTruthy();
  });

  test('valor livre zero mostra zero sem déficit fictício', () => {
    const configuracao = {
      ...configuracaoBase,
      saldoAtual: 30_000,
      reserva: 10_000,
      contasPendentes: 20_000,
    };
    mockOnboardingValue = contexto({ configuracao });
    renderFeature(<HomeScreen />);
    expect(screen.getByText('Sem valor livre')).toBeTruthy();
    expect(screen.queryByText(/Déficit:/)).toBeNull();
  });

  test('gasto acima do limite mostra excedente e restante zero', () => {
    const configuracao = {
      ...configuracaoBase,
      saldoAtual: 60_000,
      gastosRegistrados: [
        { id: 'g-1', valor: 20_000, data: '2026-07-25' },
      ],
    };
    mockOnboardingValue = contexto({ configuracao });
    renderFeature(<HomeScreen />);
    expect(screen.getByText(/Excedente de hoje:/)).toBeTruthy();
    expect(screen.getAllByText('R$ 0,00').length).toBeGreaterThan(0);
  });

  test('dados corrompidos só recomeçam após ação explícita', async () => {
    const recomecarPlanejamento = jest.fn(async () => undefined);
    mockOnboardingValue = contexto({
      status: 'erro',
      configuracao: null,
      resultado: null,
      falhaHidratacao: {
        origem: 'dados-corrompidos',
        mensagem: 'Dados inválidos',
      },
      recomecarPlanejamento,
    });
    renderFeature(<HomeScreen />);
    expect(recomecarPlanejamento).not.toHaveBeenCalled();
    fireEvent.press(
      screen.getByRole('button', { name: 'Recomeçar planejamento' }),
    );
    await waitFor(() => expect(recomecarPlanejamento).toHaveBeenCalledTimes(1));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});

describe('registro e edição reais', () => {
  test.each([
    ['0', /maior que R\$ 0,00/i],
    ['-1', /maior que R\$ 0,00/i],
    ['abc', /valor válido/i],
  ])('registro rejeita valor inválido %s na experiência real', async (valor, mensagem) => {
    const registrarGasto = jest.fn(async (dados) =>
      registrarGastoNoDominio(configuracaoBase, dados, '2026-07-25', () => 'g-ui'),
    );
    mockOnboardingValue = contexto({ registrarGasto });
    renderFeature(<ExpenseForm />);
    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), valor);
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    expect(await screen.findByText(mensagem)).toBeTruthy();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  test('descrição vazia é omitida e descrição acima do limite é rejeitada', async () => {
    let resultadoRegistrado: ReturnType<typeof registrarGastoNoDominio> | null = null;
    const registrarGasto = jest.fn(async (dados) => {
      resultadoRegistrado = registrarGastoNoDominio(
        configuracaoBase,
        dados,
        '2026-07-25',
        () => 'g-ui',
      );
      return resultadoRegistrado;
    });
    mockOnboardingValue = contexto({ registrarGasto });
    const { rerender } = renderFeature(<ExpenseForm />);
    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), '10,00');
    fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), '   ');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    await waitFor(() => expect(registrarGasto).toHaveBeenCalledTimes(1));
    expect(resultadoRegistrado!.configuracao.gastosRegistrados[0]).not.toHaveProperty(
      'descricao',
    );

    mockRouter.dismissTo.mockClear();
    registrarGasto.mockClear();
    rerender(<ExpenseForm />);
    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), '10,00');
    fireEvent.changeText(
      screen.getByLabelText('Descrição (opcional)'),
      'a'.repeat(81),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    expect(await screen.findByText(/no máximo 80 caracteres/i)).toBeTruthy();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });
  test('registro anuncia erro obrigatório uma vez, preserva o formulário e permite nova tentativa', async () => {
    const registrarGasto = jest.fn()
      .mockRejectedValueOnce(new Error('Informe o valor do gasto.'))
      .mockResolvedValueOnce({});
    mockOnboardingValue = contexto({
      registrarGasto,
    });
    renderFeature(<ExpenseForm />);
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), 'Mercado');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    expect(await screen.findByText(/Informe o valor do gasto/i)).toBeTruthy();
    const alert = screen.getByRole('alert');
    expect(alert.props.accessibilityLiveRegion).toBe('assertive');
    expect(alert.props.accessibilityLabel).toBe(
      'Erro em Valor do gasto: Informe o valor do gasto.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByDisplayValue('Mercado')).toBeTruthy();
    expect(registrarGasto).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Gasto registrado')).toBeNull();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), '10,00');
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    await waitFor(() => expect(registrarGasto).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Gasto registrado')).toBeTruthy();
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/home');
  });

  test('registro bloqueia duplicidade, dá sucesso e navega após persistir', async () => {
    const persistence = deferred<Awaited<ReturnType<typeof mockOnboardingValue.registrarGasto>>>();
    const registrarGasto = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({ registrarGasto });
    renderFeature(<ExpenseForm />);
    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), '10,00');
    const button = screen.getByRole('button', { name: 'Registrar gasto' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(registrarGasto).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Registrando…' }).props
        .accessibilityState,
    ).toEqual({ busy: true, disabled: true });
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
    await act(async () => persistence.resolve({} as never));
    expect(await screen.findByText('Gasto registrado')).toBeTruthy();
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/home');
  });

  test('falha no registro não navega e permite repetir', async () => {
    const registrarGasto = jest.fn()
      .mockRejectedValueOnce(new Error('Armazenamento indisponível'))
      .mockResolvedValueOnce({});
    mockOnboardingValue = contexto({ registrarGasto });
    renderFeature(<ExpenseForm />);
    fireEvent.changeText(screen.getByLabelText('Valor do gasto'), '10,00');
    fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), 'Almoço');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    expect(await screen.findByText('Armazenamento indisponível')).toBeTruthy();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Almoço')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/home'));
  });

  test('edição carrega dados e no-op não apresenta falso sucesso', async () => {
    const configuracao = {
      ...configuracaoBase,
      gastosRegistrados: [{ id: 'g-1', valor: 1500, data: '2026-07-25', descricao: 'Mercado' }],
    };
    const editarGasto = jest.fn(async () => ({ alterado: false }));
    mockOnboardingValue = contexto({ configuracao, editarGasto });
    renderFeature(<EditExpenseScreen id="g-1" />);
    expect(screen.getByDisplayValue('Mercado')).toBeTruthy();
    expect(screen.getByDisplayValue('R$ 15,00')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Salvar alteração' }));
    await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/historico'));
    expect(screen.queryByText('Alteração salva')).toBeNull();
  });

  test('edição bloqueia duplo toque e só navega após persistência', async () => {
    const configuracao = {
      ...configuracaoBase,
      gastosRegistrados: [{ id: 'g-1', valor: 1500, data: '2026-07-25' }],
    };
    const persistence = deferred<{ alterado: boolean }>();
    const editarGasto = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({ configuracao, editarGasto });
    renderFeature(<EditExpenseScreen id="g-1" />);
    fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), 'Farmácia');
    const button = screen.getByRole('button', { name: 'Salvar alteração' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(editarGasto).toHaveBeenCalledTimes(1);
    await act(async () => persistence.resolve({ alterado: true }));
    expect(await screen.findByText('Alteração salva')).toBeTruthy();
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/historico');
  });

  test('gasto inexistente apresenta recuperação segura', () => {
    renderFeature(<EditExpenseScreen id="ausente" />);
    expect(screen.getByText('Gasto não encontrado')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar ao histórico' })).toBeTruthy();
  });

  test('falha de edição preserva formulário e não navega', async () => {
    const configuracao = {
      ...configuracaoBase,
      gastosRegistrados: [{ id: 'g-1', valor: 1500, data: '2026-07-25', descricao: 'Mercado' }],
    };
    const editarGasto = jest.fn(async () => {
      throw new Error('Falha ao editar');
    });
    mockOnboardingValue = contexto({ configuracao, editarGasto });
    renderFeature(<EditExpenseScreen id="g-1" />);
    fireEvent.changeText(screen.getByLabelText('Descrição (opcional)'), 'Farmácia');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar alteração' }));
    expect(await screen.findByText('Falha ao editar')).toBeTruthy();
    expect(screen.getByDisplayValue('Farmácia')).toBeTruthy();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });
});

describe('exclusão e novo ciclo reais', () => {
  test('dica do novo recebimento aparece uma vez e fecha na sessão mesmo se salvar falhar', () => {
    const markContextualTipSeen = jest.fn(async () => {
      throw new Error('Falha');
    });
    mockTutorialValue = tutorialContext({ markContextualTipSeen });
    renderFeature(<NewCycleTip />);
    expect(screen.getByText('Seu ciclo atual ficará salvo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
    expect(screen.queryByText('Seu ciclo atual ficará salvo')).toBeNull();
    expect(markContextualTipSeen).toHaveBeenCalledWith('novo-recebimento');
  });

  test('dica vista não reaparece', () => {
    mockTutorialValue = tutorialContext({
      hasSeenContextualTip: jest.fn(() => true),
    });
    renderFeature(<NewCycleTip />);
    expect(screen.queryByText('Seu ciclo atual ficará salvo')).toBeNull();
  });

  test('formulário de novo ciclo mostra campos, valida negativos e não prepara rascunho inválido', () => {
    renderFeature(<NewCycleForm />);
    expect(screen.getByLabelText('Saldo atual depois de receber')).toBeTruthy();
    expect(screen.getByLabelText('Contas pendentes')).toBeTruthy();
    expect(screen.getByLabelText('Reserva protegida')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Selecionar próximo recebimento' }),
    ).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Saldo atual depois de receber'), '1000');
    fireEvent.changeText(screen.getByLabelText('Contas pendentes'), '-1');
    fireEvent.press(
      screen.getByRole('button', { name: 'Selecionar próximo recebimento' }),
    );
    fireEvent.press(screen.getByLabelText('Confirmar data no seletor'));
    fireEvent.press(screen.getByRole('button', { name: 'Revisar novo ciclo' }));
    expect(screen.getByText(/contas pendentes não pode ser negativo/i)).toBeTruthy();
    expect(mockOnboardingValue.prepararNovoCiclo).not.toHaveBeenCalled();
  });

  test('formulário válido prepara uma única revisão e cancelar não arquiva', () => {
    (globalThis as { __mockDatePickerDate?: Date }).__mockDatePickerDate =
      new Date(2099, 0, 2);
    renderFeature(<NewCycleForm />);
    fireEvent.changeText(screen.getByLabelText('Saldo atual depois de receber'), '2000');
    fireEvent.press(
      screen.getByRole('button', { name: 'Selecionar próximo recebimento' }),
    );
    fireEvent.press(screen.getByLabelText('Confirmar data no seletor'));
    fireEvent.press(screen.getByRole('button', { name: 'Revisar novo ciclo' }));
    expect(mockOnboardingValue.prepararNovoCiclo).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/novo-ciclo/revisao');
    expect(mockOnboardingValue.iniciarNovoCiclo).not.toHaveBeenCalled();
  });

  test('cancelar formulário limpa somente rascunho e não cria ciclo', () => {
    renderFeature(<NewCycleForm />);
    fireEvent.press(screen.getAllByRole('button', { name: 'Cancelar' })[1]);
    expect(mockOnboardingValue.cancelarNovoCiclo).toHaveBeenCalledTimes(1);
    expect(mockOnboardingValue.iniciarNovoCiclo).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  test('cancelar exclusão não muta; confirmar bloqueia duplicidade e mostra sucesso', async () => {
    const configuracao = {
      ...configuracaoBase,
      gastosRegistrados: [{ id: 'g-1', valor: 1500, data: '2026-07-25', descricao: 'Mercado' }],
    };
    const persistence = deferred<Awaited<ReturnType<typeof mockOnboardingValue.excluirGasto>>>();
    const excluirGasto = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({ configuracao, excluirGasto });
    const alert = jest.spyOn(Alert, 'alert');
    renderFeature(<HistoryScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
    const buttons = alert.mock.calls[0][2]!;
    buttons[0].onPress?.();
    expect(excluirGasto).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
    const confirm = alert.mock.calls[1][2]![1].onPress!;
    act(() => {
      confirm();
      confirm();
    });
    expect(excluirGasto).toHaveBeenCalledTimes(1);
    await act(async () => persistence.resolve({} as never));
    expect(await screen.findByText('Gasto excluído')).toBeTruthy();
  });

  test('falha de exclusão mantém item e permite tentar novamente', async () => {
    const configuracao = {
      ...configuracaoBase,
      gastosRegistrados: [{ id: 'g-1', valor: 1500, data: '2026-07-25' }],
    };
    const excluirGasto = jest.fn().mockRejectedValueOnce(new Error('Falha')).mockResolvedValueOnce({});
    mockOnboardingValue = contexto({ configuracao, excluirGasto });
    const alert = jest.spyOn(Alert, 'alert');
    renderFeature(<HistoryScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
    act(() => {
      alert.mock.calls[0][2]![1].onPress!();
    });
    expect(await screen.findByText('Falha')).toBeTruthy();
    expect(screen.getByText('Gasto registrado')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
    act(() => {
      alert.mock.calls[1][2]![1].onPress!();
    });
    await waitFor(() => expect(excluirGasto).toHaveBeenCalledTimes(2));
  });

  test('revisão de novo ciclo preserva aviso, bloqueia duplicidade e navega após salvar', async () => {
    const persistence = deferred<Record<string, never>>();
    const iniciarNovoCiclo = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({
      iniciarNovoCiclo,
      rascunhoNovoCiclo: {
        saldoAtual: 'R$ 2.000,00',
        contasPendentes: 'R$ 100,00',
        reserva: 'R$ 200,00',
        dataProximoRecebimento: '2026-08-25',
      },
    });
    renderFeature(<NewCycleReview />);
    expect(screen.getByText(/O ciclo atual será encerrado/)).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Iniciar novo ciclo' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(iniciarNovoCiclo).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => persistence.resolve({}));
    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  test('falha no novo ciclo não navega e libera uma nova tentativa', async () => {
    const iniciarNovoCiclo = jest.fn()
      .mockRejectedValueOnce(new Error('Falha ao arquivar'))
      .mockResolvedValueOnce({});
    mockOnboardingValue = contexto({
      iniciarNovoCiclo,
      rascunhoNovoCiclo: {
        saldoAtual: 'R$ 2.000,00',
        contasPendentes: 'R$ 100,00',
        reserva: 'R$ 200,00',
        dataProximoRecebimento: '2026-08-25',
      },
    });
    renderFeature(<NewCycleReview />);
    fireEvent.press(screen.getByRole('button', { name: 'Iniciar novo ciclo' }));
    expect(await screen.findByText('Falha ao arquivar')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Iniciar novo ciclo' }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/home'));
  });

  test('ID inválido no novo ciclo não navega nem permite duplicação', async () => {
    const persistence = deferred<Record<string, never>>();
    const iniciarNovoCiclo = jest.fn(() => persistence.promise);
    mockOnboardingValue = contexto({
      iniciarNovoCiclo,
      rascunhoNovoCiclo: {
        saldoAtual: 'R$ 2.000,00',
        contasPendentes: 'R$ 100,00',
        reserva: 'R$ 200,00',
        dataProximoRecebimento: '2026-08-25',
      },
    });
    renderFeature(<NewCycleReview />);
    const button = screen.getByRole('button', { name: 'Iniciar novo ciclo' });
    fireEvent.press(button);
    fireEvent.press(button);
    expect(iniciarNovoCiclo).toHaveBeenCalledTimes(1);
    await act(async () =>
      persistence.reject(new Error('O identificador do novo ciclo é inválido.')),
    );
    expect(await screen.findByText(/identificador do novo ciclo é inválido/i)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe('tutorial e configurações reais', () => {
  test('tour real percorre quatro passos com Próximo e Anterior', () => {
    const close = jest.fn();
    renderFeature(<InteractiveTour onClose={close} />);
    layoutTourPanel();
    expect(screen.getByText('Seu limite de hoje')).toBeTruthy();
    expect(screen.getByText('1 de 4')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    expect(screen.getByText('Mantenha o cálculo atualizado')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Anterior' }));
    layoutTourPanel();
    expect(screen.getByText('Seu limite de hoje')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    expect(screen.getByText('Revise seus registros')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    expect(screen.getByText('Entenda o cálculo')).toBeTruthy();
    expect(screen.getByText('4 de 4')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('tour possui modal acessível e Pular/Fechar conclui sem acionar alvo', () => {
    const close = jest.fn();
    const targetAction = jest.fn();
    renderFeature(
      <View>
        <View accessibilityLabel="Alvo atrás" onTouchEnd={targetAction} />
        <InteractiveTour onClose={close} />
      </View>,
    );
    layoutTourPanel();
    const overlay = screen
      .UNSAFE_getAllByType(View)
      .find((node) => node.props.accessibilityViewIsModal === true);
    expect(overlay).toBeTruthy();
    expect(targetAction).not.toHaveBeenCalled();
    fireEvent.press(
      screen.getByRole('button', { name: 'Fechar e concluir tour' }),
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(targetAction).not.toHaveBeenCalled();
  });

  test('reduzir movimento preserva os quatro passos e suas ações', () => {
    (globalThis as { __mockReduceMotion?: boolean }).__mockReduceMotion = true;
    const close = jest.fn();
    renderFeature(<InteractiveTour onClose={close} />);
    layoutTourPanel();
    expect(screen.getByText('1 de 4')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    fireEvent.press(screen.getByRole('button', { name: 'Próximo' }));
    layoutTourPanel();
    expect(screen.getByText('4 de 4')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('Home pendente monta o tour e isola o conteúdo financeiro', () => {
    mockTutorialValue = tutorialContext({
      state: {
        ...tutorialContext().state,
        tourHomeConcluido: false,
      },
    });
    renderFeature(<HomeScreen />);
    expect(screen.getByText('Seu limite de hoje', {
      includeHiddenElements: true,
    })).toBeTruthy();
    const hiddenContent = screen
      .UNSAFE_getAllByType(View)
      .find((node) => node.props.accessibilityElementsHidden === true);
    expect(hiddenContent).toBeTruthy();
  });

  test('tour concluído não abre', () => {
    mockTutorialValue = tutorialContext({
      state: {
        ...tutorialContext().state,
        tourHomeConcluido: true,
      },
    });
    renderFeature(<HomeScreen />);
    expect(screen.queryByText('Seu limite de hoje')).toBeNull();
    expect(screen.getByRole('button', { name: 'Registrar gasto' })).toBeTruthy();
  });

  test('revisão da apresentação não altera flags e retorna às configurações', () => {
    renderFeature(<IntroductionScreen reviewMode />);
    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.press(screen.getByRole('button', { name: 'Voltar às configurações' }));
    expect(mockTutorialValue.completeIntroduction).not.toHaveBeenCalled();
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/configuracoes');
  });

  test('Configurações expõe aparência, ajuda e Sobre acessíveis', () => {
    renderFeature(<SettingsScreen />);
    expect(screen.getByRole('radio', { name: /Usar tema do aparelho/ }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('button', { name: /Ver apresentação do aplicativo/ })).toBeTruthy();
    expect(screen.getByLabelText(
      'Saldo do Dia. Versão 1.0.0. Release 1. Powered by Leahcim.',
    )).toBeTruthy();
  });

  test('Ajuda abre revisão e repetição redefine somente o tour', async () => {
    const resetHomeTour = jest.fn(async () => undefined);
    mockTutorialValue = tutorialContext({ resetHomeTour });
    renderFeature(<SettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: /Ver apresentação do aplicativo/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/apresentacao',
      params: { modo: 'revisao' },
    });
    fireEvent.press(screen.getByRole('button', { name: /Repetir tour da tela inicial/ }));
    await waitFor(() => expect(resetHomeTour).toHaveBeenCalledTimes(1));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/home');
  });

  test('seleção manual de aparência é aplicada pela opção acessível', async () => {
    renderFeature(<SettingsScreen />);
    fireEvent.press(screen.getByRole('radio', { name: /Escuro/ }));
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: /Escuro/ }).props.accessibilityState.checked)
        .toBe(true),
    );
  });

  test('tema manual é persistido e selecionado sem anúncio duplicado', async () => {
    const persistence = deferred<void>();
    mockSaveAppearance.mockImplementationOnce(() => persistence.promise);
    renderFeature(<SettingsScreen />);
    fireEvent.press(screen.getByRole('radio', { name: /Escuro/ }));
    expect(mockSaveAppearance).toHaveBeenCalledWith('escuro');
    expect(
      screen.getByRole('radio', { name: /Escuro/ }).props.accessibilityState
        .busy,
    ).toBe(true);
    await act(async () => persistence.resolve());
    expect(
      screen.getByRole('radio', { name: /Escuro/ }).props.accessibilityState
        .checked,
    ).toBe(true);
    expect(screen.getAllByRole('radio', { name: /Escuro/ })).toHaveLength(1);
  });

  test('falha ao persistir aparência mantém seleção na sessão e mostra aviso acessível', async () => {
    mockSaveAppearance.mockRejectedValueOnce(new Error('Falha'));
    renderFeature(<SettingsScreen />);
    fireEvent.press(screen.getByRole('radio', { name: /Escuro/ }));
    expect(
      await screen.findByText(
        'A aparência foi aplicada nesta sessão, mas não pôde ser salva. Tente novamente.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: /Escuro/ }).props.accessibilityState
        .checked,
    ).toBe(true);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
