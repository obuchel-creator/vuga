import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';

describe('Kampala Traffic App UI', () => {
  it('renders login screen and switches to register', () => {
    const { getByText } = render(<App />);
    expect(getByText('Kampala Traffic')).toBeTruthy();
    fireEvent.press(getByText('No account? Register'));
    expect(getByText('Register')).toBeTruthy();
    fireEvent.press(getByText('Have an account? Login'));
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows validation error for empty report', async () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    // Simulate login
    fireEvent.changeText(getByPlaceholderText('Email (or leave blank if using phone)'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Login'));
    await waitFor(() => getByText('Report Traffic Jam'));
    fireEvent.press(getByText('Submit'));
    await waitFor(() => getByText('Validation'));
    expect(getByText('Validation')).toBeTruthy();
  });
});