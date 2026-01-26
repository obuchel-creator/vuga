// Mock NetInfo for offline/online detection
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
// __tests__/Chat.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ReportsScreen from '../src/ReportsScreen';

global.WebSocket = function () {
  this.close = jest.fn();
  this.send = jest.fn();
  this.addEventListener = jest.fn();
  this.removeEventListener = jest.fn();
  this.readyState = 1;
  this.onopen = null;
  this.onmessage = null;
};

describe('Real-time Incident Chat', () => {
  it('renders chat input and sends a message', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<ReportsScreen />);
    // Wait for ReportsScreen to load
    await waitFor(() => getByText('Submit'));
    // Find chat input (for first report)
    const chatInput = getByPlaceholderText('Type a message...');
    expect(chatInput).toBeTruthy();
    // Type and send a message
    await act(async () => {
      fireEvent.changeText(chatInput, 'Hello world!');
      fireEvent.press(getByTestId('chat-send-btn'));
    });
    // Message should be sent via WebSocket (mocked)
  });
});
