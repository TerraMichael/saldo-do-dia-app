export type AppColorScheme = 'light' | 'dark';

export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primaryBorder: string;
  positiveBadge: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  border: string;
  borderStrong: string;
  divider: string;
  success: string;
  successSoft: string;
  warning: string;
  warningText: string;
  warningSoft: string;
  warningBorder: string;
  warningBadge: string;
  error: string;
  errorStrong: string;
  errorSoft: string;
  errorBorder: string;
  disabled: string;
  white: string;
}

export const lightColors: AppColors = {
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
};

export const darkColors: AppColors = {
  background: '#0D1511',
  surface: '#142019',
  surfaceMuted: '#19271F',
  primary: '#5CCB8C',
  primaryDark: '#8BE3AE',
  primarySoft: '#173425',
  primaryBorder: '#2F6747',
  positiveBadge: '#1C3D2C',
  text: '#F2F7F3',
  textSecondary: '#B8C6BD',
  textMuted: '#94A49A',
  placeholder: '#7E8E84',
  border: '#2A3A30',
  borderStrong: '#3A4C40',
  divider: '#223128',
  success: '#75D69E',
  successSoft: '#163524',
  warning: '#F0B36E',
  warningText: '#F5C995',
  warningSoft: '#3A2818',
  warningBorder: '#6D4B28',
  warningBadge: '#4A321D',
  error: '#FF8E8E',
  errorStrong: '#FFAAAA',
  errorSoft: '#3B1D1D',
  errorBorder: '#6A3333',
  disabled: '#67756D',
  white: '#FFFFFF',
};
