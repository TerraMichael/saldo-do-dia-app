export const motion = {
  duration: {
    immediate: 0,
    pressIn: 90,
    pressOut: 130,
    fast: 140,
    standard: 190,
    emphasized: 240,
    feedbackVisible: 2200,
    loadingCycle: 1800,
  },
  scale: {
    pressed: 0.98,
    loadingMin: 0.985,
    loadingMax: 1.015,
  },
  opacity: {
    pressed: 0.82,
    loadingMin: 0.88,
  },
  distance: {
    subtle: 4,
    small: 8,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.2, 0, 0, 1] as const,
  },
} as const;
