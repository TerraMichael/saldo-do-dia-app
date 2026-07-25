import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { AboutSection } from '../src/features/settings/components/AboutSection';
import {
  AppButton,
  AppStateView,
  AppTextField,
  AppThemeProvider,
  InlineFeedback,
  MoneyInput,
} from '../src/ui';

jest.mock('../src/storage/appearance-storage', () => ({
  armazenamentoAparencia: {
    carregar: jest.fn(async () => 'sistema'),
    salvar: jest.fn(async () => undefined),
  },
  carregarAparenciaComFallback: jest.fn(
    () => new Promise<never>(() => undefined),
  ),
}));

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

function renderWithTheme(element: React.ReactElement) {
  return render(<AppThemeProvider>{element}</AppThemeProvider>);
}

test('botão executa uma ação e expõe nome acessível', () => {
  const onPress = jest.fn();
  renderWithTheme(<AppButton label="Registrar gasto" onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: 'Registrar gasto' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('botão desabilitado e processando não executa ação', () => {
  const onPress = jest.fn();
  renderWithTheme(
    <AppButton
      label="Salvar"
      onPress={onPress}
      processing
    />,
  );
  const button = screen.getByRole('button', { name: 'Salvar' });
  expect(button.props.accessibilityState).toEqual({
    busy: true,
    disabled: true,
  });
  fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('campo textual mantém label, hint e alteração observável', () => {
  const onChangeText = jest.fn();
  renderWithTheme(
    <AppTextField
      hint="Ajuda você a identificar o gasto."
      label="Descrição (opcional)"
      onChangeText={onChangeText}
      value=""
    />,
  );
  fireEvent.changeText(
    screen.getByLabelText('Descrição (opcional)'),
    'Mercado',
  );
  expect(onChangeText).toHaveBeenCalledWith('Mercado');
  expect(screen.getByText('Ajuda você a identificar o gasto.')).toBeTruthy();
});

test('campo monetário apresenta erro próximo ao controle', () => {
  renderWithTheme(
    <MoneyInput
      error="Informe o valor do gasto."
      label="Valor do gasto"
      onChangeText={jest.fn()}
      value=""
    />,
  );
  expect(screen.getByLabelText('Valor do gasto')).toBeTruthy();
  expect(screen.getByText('Informe o valor do gasto.')).toBeTruthy();
});

test('feedback apresenta texto e semântica de alerta', () => {
  renderWithTheme(
    <InlineFeedback
      message="Não foi possível salvar."
      variant="error"
    />,
  );
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Não foi possível salvar.')).toBeTruthy();
});

test('estado de erro oferece recuperação acessível', () => {
  const retry = jest.fn();
  renderWithTheme(
    <AppStateView
      description="Tente novamente."
      primaryAction={{ label: 'Tentar novamente', onPress: retry }}
      title="Não foi possível carregar"
    />,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(retry).toHaveBeenCalledTimes(1);
});

test('seção Sobre é informativa e agrupada para acessibilidade', () => {
  renderWithTheme(<AboutSection />);
  expect(screen.getByRole('header', { name: 'Sobre' })).toBeTruthy();
  expect(
    screen.getByLabelText(
      'Saldo do Dia. Versão 1.0.0. Release 1. Powered by Leahcim.',
    ),
  ).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
