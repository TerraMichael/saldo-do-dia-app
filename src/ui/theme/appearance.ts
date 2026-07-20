import type { AppColorScheme } from './colors';

export type PreferenciaAparencia = 'sistema' | 'claro' | 'escuro';

export const PREFERENCIA_APARENCIA_PADRAO: PreferenciaAparencia = 'sistema';

export function ehPreferenciaAparencia(
  valor: unknown,
): valor is PreferenciaAparencia {
  return valor === 'sistema' || valor === 'claro' || valor === 'escuro';
}

export function resolverEsquemaAparencia(
  preferencia: PreferenciaAparencia,
  esquemaSistema: string | null | undefined,
): AppColorScheme {
  if (preferencia === 'claro') return 'light';
  if (preferencia === 'escuro') return 'dark';
  return esquemaSistema === 'dark' ? 'dark' : 'light';
}
