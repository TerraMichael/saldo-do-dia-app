export type AppFeedbackVariant = 'success' | 'info';

export interface AppFeedbackMessage {
  id: string;
  message: string;
  variant: AppFeedbackVariant;
}

export interface AppFeedbackState {
  current: AppFeedbackMessage | null;
  nextId: number;
}

export const APP_FEEDBACK_INITIAL_STATE: AppFeedbackState = {
  current: null,
  nextId: 1,
};

export type AppFeedbackAction =
  | {
      type: 'show';
      message: string;
      variant: AppFeedbackVariant;
    }
  | { type: 'dismiss' };

export function reduceAppFeedback(
  state: AppFeedbackState,
  action: AppFeedbackAction,
): AppFeedbackState {
  if (action.type === 'dismiss') {
    return { ...state, current: null };
  }

  return {
    current: {
      id: `feedback-${state.nextId}`,
      message: action.message,
      variant: action.variant,
    },
    nextId: state.nextId + 1,
  };
}

