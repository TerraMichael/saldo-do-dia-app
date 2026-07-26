module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests-ui/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests-ui/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@expo|expo|expo-.*|expo-modules-core|@expo/vector-icons|react-native-reanimated|react-native-worklets)/)',
  ],
};
