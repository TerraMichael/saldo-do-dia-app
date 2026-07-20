import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { motion } from '../motion';
import {
  APP_FEEDBACK_INITIAL_STATE,
  reduceAppFeedback,
  type AppFeedbackMessage,
  type AppFeedbackVariant,
} from './model';

interface AppFeedbackContextValue {
  feedback: AppFeedbackMessage | null;
  showFeedback(message: string, variant?: AppFeedbackVariant): void;
  dismissFeedback(): void;
}

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

export function AppFeedbackProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    reduceAppFeedback,
    APP_FEEDBACK_INITIAL_STATE,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const dismissFeedback = useCallback(() => {
    clearDismissTimer();
    dispatch({ type: 'dismiss' });
  }, [clearDismissTimer]);

  const showFeedback = useCallback(
    (message: string, variant: AppFeedbackVariant = 'success') => {
      clearDismissTimer();
      dispatch({ type: 'show', message, variant });
      timer.current = setTimeout(
        () => dispatch({ type: 'dismiss' }),
        motion.duration.feedbackVisible,
      );
    },
    [clearDismissTimer],
  );

  useEffect(() => clearDismissTimer, [clearDismissTimer]);

  const value = useMemo(
    () => ({
      feedback: state.current,
      showFeedback,
      dismissFeedback,
    }),
    [dismissFeedback, showFeedback, state],
  );

  return (
    <AppFeedbackContext.Provider value={value}>
      {children}
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error(
      'useAppFeedback deve ser usado dentro de AppFeedbackProvider.',
    );
  }
  return context;
}
