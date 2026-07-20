import type { AppColorScheme } from './colors';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '800' as const },
  title: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const },
  section: { fontSize: 18, lineHeight: 24, fontWeight: '800' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '800' as const },
  moneyHero: { fontSize: 42, lineHeight: 50, fontWeight: '800' as const },
} as const;

export const sizes = {
  touchTarget: 48,
  inputHeight: 56,
  contentMaxWidth: 680,
} as const;

export function criarElevation(colorScheme: AppColorScheme) {
  return {
    card: {
      elevation: colorScheme === 'dark' ? 0 : 1,
      shadowColor: colorScheme === 'dark' ? '#000000' : '#17251E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colorScheme === 'dark' ? 0 : 0.06,
      shadowRadius: 4,
    },
  } as const;
}
