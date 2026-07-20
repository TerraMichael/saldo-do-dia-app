import {
  darkColors,
  lightColors,
  type AppColors,
  type AppColorScheme,
} from './colors';
import { criarElevation } from './tokens';
import {
  PREFERENCIA_APARENCIA_PADRAO,
  resolverEsquemaAparencia,
  type PreferenciaAparencia,
} from './appearance';

export interface AppTheme {
  preference: PreferenciaAparencia;
  colorScheme: AppColorScheme;
  dark: boolean;
  colors: AppColors;
  elevation: ReturnType<typeof criarElevation>;
  statusBarStyle: 'light' | 'dark';
  themeReady: boolean;
  setPreference(preference: PreferenciaAparencia): Promise<void>;
}

export function criarAppTheme(
  systemColorScheme: string | null | undefined,
  preference: PreferenciaAparencia = PREFERENCIA_APARENCIA_PADRAO,
) {
  const scheme = resolverEsquemaAparencia(preference, systemColorScheme);

  return {
    preference,
    colorScheme: scheme,
    dark: scheme === 'dark',
    colors: scheme === 'dark' ? darkColors : lightColors,
    elevation: criarElevation(scheme),
    statusBarStyle:
      scheme === 'dark' ? ('light' as const) : ('dark' as const),
  };
}
