// Mock expo-notifications for Jest
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));
// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

// Mock NetInfo for offline/online detection
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
// Force Jest to use the real react-native module
jest.unmock('react-native');
// Mock window.addEventListener and removeEventListener for Jest
if (typeof window !== 'undefined') {
  if (!window.addEventListener) window.addEventListener = jest.fn();
  if (!window.removeEventListener) window.removeEventListener = jest.fn();
}
// Mock global WebSocket
if (typeof global !== 'undefined') {
  if (!global.WebSocket) global.WebSocket = require('./__mocks__/ws.js').default;
}
// Mock Alert.alert only (no circular dependency)
const rn = require('react-native');
if (rn && rn.Alert && typeof rn.Alert.alert === 'function') {
  jest.spyOn(rn.Alert, 'alert').mockImplementation(jest.fn());
}
// Mock axios
jest.mock('axios');