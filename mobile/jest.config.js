module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|expo|expo-localization|expo-modules-core|expo-.*|i18n-js|make-plural|react-native-maps|@expo/vector-icons)/)'
  ],
  moduleNameMapper: {
    '^expo-localization$': '<rootDir>/__mocks__/expo-localization.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^expo-image-picker$': '<rootDir>/__mocks__/expo-image-picker.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-notifications/.*$': '<rootDir>/__mocks__/expo-notifications.js',
    '^i18n-js$': '<rootDir>/__mocks__/i18n-js.js',
    // Do not mock react-native
  },
};
