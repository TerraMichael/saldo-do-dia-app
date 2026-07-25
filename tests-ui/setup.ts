jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () =>
    (globalThis as { __mockReduceMotion?: boolean }).__mockReduceMotion ??
    false,
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockIcon({ name }: { name: string }) {
    return React.createElement(Text, null, name);
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function MockDateTimePicker({
    onChange,
    value,
  }: {
    onChange: (event: { type: string }, date?: Date) => void;
    value: Date;
  }) {
    return React.createElement(
      Pressable,
      {
        accessibilityLabel: 'Confirmar data no seletor',
        onPress: () =>
          onChange(
            { type: 'set' },
            (globalThis as { __mockDatePickerDate?: Date })
              .__mockDatePickerDate ?? value,
          ),
      },
      React.createElement(Text, null, 'Seletor de data'),
    );
  };
});

jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

afterEach(() => {
  delete (globalThis as { __mockDatePickerDate?: Date }).__mockDatePickerDate;
  delete (globalThis as { __mockReduceMotion?: boolean }).__mockReduceMotion;
  jest.clearAllMocks();
  jest.useRealTimers();
});
