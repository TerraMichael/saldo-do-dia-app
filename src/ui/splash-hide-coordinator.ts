interface ScheduledRetry {
  cancel(): void;
}

export interface SplashHideCoordinatorDependencies {
  hideAsync(): Promise<void>;
  hide(): void;
  scheduleRetry(callback: () => void): ScheduledRetry;
  warn?: () => void;
  maxAsyncAttempts?: number;
}

export interface SplashHideCoordinator {
  markReady(): void;
  dispose(): void;
}

export function createSplashHideCoordinator({
  hideAsync,
  hide,
  scheduleRetry,
  warn,
  maxAsyncAttempts = 2,
}: SplashHideCoordinatorDependencies): SplashHideCoordinator {
  let mounted = true;
  let ready = false;
  let inFlight = false;
  let hidden = false;
  let exhausted = false;
  let attempts = 0;
  let pendingRetry: ScheduledRetry | null = null;

  function fallback() {
    if (!mounted || hidden) return;

    try {
      hide();
      hidden = true;
    } catch {
      warn?.();
    }
  }

  function attempt() {
    if (
      !mounted ||
      !ready ||
      hidden ||
      exhausted ||
      inFlight ||
      pendingRetry
    ) {
      return;
    }

    inFlight = true;
    attempts += 1;

    void hideAsync()
      .then(() => {
        if (mounted) hidden = true;
      })
      .catch(() => {
        if (!mounted) return;

        if (attempts < maxAsyncAttempts) {
          pendingRetry = scheduleRetry(() => {
            pendingRetry = null;
            attempt();
          });
        } else {
          exhausted = true;
          fallback();
        }
      })
      .finally(() => {
        inFlight = false;
      });
  }

  return {
    markReady() {
      ready = true;
      attempt();
    },
    dispose() {
      mounted = false;
      pendingRetry?.cancel();
      pendingRetry = null;
    },
  };
}
