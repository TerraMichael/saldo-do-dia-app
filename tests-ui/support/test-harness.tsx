import { render } from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  AppFeedbackHost,
  AppFeedbackProvider,
  AppThemeProvider,
} from '../../src/ui';

export const routerMock = {
  back: jest.fn(),
  dismissTo: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function Providers({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 24, right: 0, bottom: 24, left: 0 },
      }}
    >
      <AppThemeProvider>
        <AppFeedbackProvider>
          {children}
          <AppFeedbackHost />
        </AppFeedbackProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

export function renderFeature(element: ReactElement) {
  return render(element, { wrapper: Providers });
}
