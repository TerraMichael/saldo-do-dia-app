import { Easing } from 'react-native-reanimated';

import { motion } from './tokens';

export const motionEasing = {
  standard: Easing.bezier(...motion.easing.standard),
  emphasized: Easing.bezier(...motion.easing.emphasized),
} as const;

