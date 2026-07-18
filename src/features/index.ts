/** Domínios previstos para a evolução incremental do produto. */
export const productFeatures = [
  'onboarding',
  'balance',
  'income',
  'bills',
  'expenses',
  'daily-limit',
  'history',
] as const;

export type ProductFeature = (typeof productFeatures)[number];
