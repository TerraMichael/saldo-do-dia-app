export const colors = {
  background: '#F4F8F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F6F2',
  primary: '#28734F',
  primaryDark: '#1E6847',
  primarySoft: '#E3F2E8',
  primaryBorder: '#C4DECE',
  positiveBadge: '#D2E9DA',
  text: '#17251E',
  textSecondary: '#526159',
  textMuted: '#68766E',
  placeholder: '#849088',
  border: '#D9E4DC',
  borderStrong: '#CAD8CF',
  divider: '#E8EEE9',
  success: '#1E6847',
  successSoft: '#E3F2E8',
  warning: '#8A4E18',
  warningText: '#714B28',
  warningSoft: '#FFF4E8',
  warningBorder: '#EDCFAE',
  warningBadge: '#F7DFC2',
  error: '#A52D2D',
  errorStrong: '#8F2929',
  errorSoft: '#FDECEC',
  errorBorder: '#E8B8B8',
  disabled: '#AAB4AE',
  white: '#FFFFFF',
} as const;

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

export const elevation = {
  card: {
    elevation: 1,
    shadowColor: '#17251E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
} as const;
