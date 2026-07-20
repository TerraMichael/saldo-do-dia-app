import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import {
  createSplashHideCoordinator,
  type SplashHideCoordinator,
} from '../splash-hide-coordinator';

interface LaunchSplashControllerProps extends PropsWithChildren {
  hydrationReady: boolean;
}

const LaunchScreenContext = createContext<(() => void) | null>(null);

export function LaunchSplashController({
  hydrationReady,
  children,
}: LaunchSplashControllerProps) {
  const coordinator = useRef<SplashHideCoordinator | null>(null);
  const initialScreenReady = useRef(false);

  if (!coordinator.current) {
    coordinator.current = createSplashHideCoordinator({
      hideAsync: () => SplashScreen.hideAsync(),
      hide: () => SplashScreen.hide(),
      scheduleRetry: (callback) => {
        const frame = requestAnimationFrame(callback);
        return { cancel: () => cancelAnimationFrame(frame) };
      },
      warn: () => {
        if (__DEV__) {
          console.warn('Não foi possível ocultar a splash nativa.');
        }
      },
    });
  }

  useEffect(() => {
    const currentCoordinator = coordinator.current;
    return () => currentCoordinator?.dispose();
  }, []);

  useEffect(() => {
    if (hydrationReady && initialScreenReady.current) {
      coordinator.current?.markReady();
    }
  }, [hydrationReady]);

  const markInitialScreenReady = useCallback(() => {
    initialScreenReady.current = true;
    if (!hydrationReady) return;
    coordinator.current?.markReady();
  }, [hydrationReady]);

  return (
    <LaunchScreenContext.Provider value={markInitialScreenReady}>
      {children}
    </LaunchScreenContext.Provider>
  );
}

export function useMarkInitialScreenReady() {
  return useContext(LaunchScreenContext);
}
