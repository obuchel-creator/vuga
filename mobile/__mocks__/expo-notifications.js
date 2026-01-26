exports.addNotificationReceivedListener = jest.fn();
exports.addNotificationResponseReceivedListener = jest.fn();
exports.requestPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
exports.scheduleNotificationAsync = jest.fn(() => Promise.resolve());
exports.getExpoPushTokenAsync = jest.fn(() => Promise.resolve({ data: 'mock-token' }));
