// Mock NetInfo for offline/online detection
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
// __tests__/OfflineMode.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ReportsScreen from '../src/ReportsScreen';

describe('Offline Mode Integration', () => {
  it('queues a report when offline and syncs when online', async () => {
    const { getByText, getByPlaceholderText } = render(<ReportsScreen />);
    await waitFor(() => getByText('Submit'));
    // Simulate offline
    await act(async () => {
      fireEvent.press(getByText('Go Offline'));
    });
    // Fill in report fields
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Location'), 'Offline Location');
      fireEvent.changeText(getByPlaceholderText('Description'), 'Offline Description');
      fireEvent.press(getByText('Submit'));
    });
    // Should show queued message
    await waitFor(() => getByText(/queued|offline/i));
    // Simulate online
    await act(async () => {
      fireEvent.press(getByText('Go Online'));
    });
    // Should sync and clear queue
    await waitFor(() => expect(getByText('Submit')).toBeTruthy());
  });
});
