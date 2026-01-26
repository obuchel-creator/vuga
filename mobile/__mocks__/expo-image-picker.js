export default {
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
};
