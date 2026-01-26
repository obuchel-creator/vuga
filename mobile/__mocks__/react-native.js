// Enhanced mock for React Native's Alert
const Alert = {
  _lastAlert: null,
  alert: jest.fn((title, message, buttons) => {
    Alert._lastAlert = { title, message, buttons };
    if (buttons && Array.isArray(buttons) && buttons[0] && typeof buttons[0].onPress === 'function') {
      buttons[0].onPress();
    }
  }),
  getLastAlert: () => Alert._lastAlert,
  clearLastAlert: () => { Alert._lastAlert = null; },
};
module.exports = { Alert };
