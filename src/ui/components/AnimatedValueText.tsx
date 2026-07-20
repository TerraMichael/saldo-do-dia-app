import { useEffect, useRef, useState } from 'react';
import {
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

import { motion } from '../motion';

interface AnimatedValueTextProps {
  value: string;
  active?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const ENTERING = FadeInDown.duration(motion.duration.standard)
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: motion.distance.subtle }],
  })
  .reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(motion.duration.fast).reduceMotion(
  ReduceMotion.System,
);

export function AnimatedValueText({
  value,
  active = true,
  style,
  accessibilityLabel,
}: AnimatedValueTextProps) {
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);
  const [displayedValue, setDisplayedValue] = useState(value);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (active && value !== displayedValue) setDisplayedValue(value);
  }, [active, displayedValue, value]);

  return (
    <Animated.Text
      accessibilityLabel={accessibilityLabel}
      entering={!mounted.current || reduceMotion ? undefined : ENTERING}
      exiting={reduceMotion ? undefined : EXITING}
      key={displayedValue}
      style={style}
    >
      {displayedValue}
    </Animated.Text>
  );
}
