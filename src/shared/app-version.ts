import { APP_IDENTITY } from './app-identity';

const METADATA_NOT_AVAILABLE = 'Não informada';

export interface AppReleaseInfo {
  version: string;
  release: string;
  productName: string;
  publisherName: string;
  accessibilityLabel: string;
}

export interface ExpoReleaseConfig {
  version?: unknown;
  android?: {
    versionCode?: unknown;
  };
}

export function createAppReleaseInfo(
  expoConfig: ExpoReleaseConfig | null | undefined,
): AppReleaseInfo {
  const version =
    typeof expoConfig?.version === 'string' && expoConfig.version.trim()
      ? expoConfig.version
      : METADATA_NOT_AVAILABLE;
  const versionCode = expoConfig?.android?.versionCode;
  const release =
    typeof versionCode === 'number' &&
    Number.isInteger(versionCode) &&
    versionCode > 0
      ? String(versionCode)
      : METADATA_NOT_AVAILABLE;
  const { productName, publisherName } = APP_IDENTITY;

  return {
    version,
    release,
    productName,
    publisherName,
    accessibilityLabel: `${productName}. Versão ${version}. Release ${release}. Powered by ${publisherName}.`,
  };
}
