import Constants from 'expo-constants';

import {
  createAppReleaseInfo,
  type AppReleaseInfo,
} from './app-version';

export function getAppReleaseInfo(): AppReleaseInfo {
  return createAppReleaseInfo(Constants.expoConfig);
}
