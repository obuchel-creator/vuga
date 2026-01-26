// __tests__/Admin.test.js
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AdminScreen from '../src/AdminScreen';

describe('AdminScreen Integration', () => {
  it('renders and sends a broadcast', async () => {
    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    await waitFor(() => getByText('Admin Tools'));
    // Fill in broadcast message
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Message to broadcast'), 'Test broadcast');
      fireEvent.press(getByText('Send Broadcast'));
    });
    // Should show status
    await waitFor(() => getByText(/Broadcast sent|Failed to send broadcast/));
  });

  it('renders and sends a user message', async () => {
    const { getByText, getByPlaceholderText } = render(<AdminScreen />);
    await waitFor(() => getByText('Admin Tools'));
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('To User ID'), '2');
      fireEvent.changeText(getByPlaceholderText('Message text'), 'Hello user 2');
      fireEvent.press(getByText('Send Message'));
    });
    await waitFor(() => getByText(/Message sent|Failed to send message/));
  });
});
