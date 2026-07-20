import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { criarAppTheme, type AppTheme } from './create-theme';
import {
  PREFERENCIA_APARENCIA_PADRAO,
  type PreferenciaAparencia,
} from './appearance';
import {
  armazenamentoAparencia,
  carregarAparenciaComFallback,
} from '../../storage/appearance-storage';

const AppThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<PreferenciaAparencia>(
    PREFERENCIA_APARENCIA_PADRAO,
  );
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let active = true;

    void carregarAparenciaComFallback(armazenamentoAparencia)
      .then((savedPreference) => {
        if (active) setPreferenceState(savedPreference);
      })
      .finally(() => {
        if (active) setThemeReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(
    async (nextPreference: PreferenciaAparencia) => {
      setPreferenceState(nextPreference);
      await armazenamentoAparencia.salvar(nextPreference);
    },
    [],
  );

  const theme = useMemo(
    (): AppTheme => ({
      ...criarAppTheme(systemColorScheme, preference),
      themeReady,
      setPreference,
    }),
    [preference, setPreference, systemColorScheme, themeReady],
  );

  return (
    <AppThemeContext.Provider value={theme}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppTheme {
  const theme = useContext(AppThemeContext);
  if (!theme) {
    throw new Error('useAppTheme deve ser usado dentro de AppThemeProvider.');
  }
  return theme;
}
