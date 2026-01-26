import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen';

describe('ProfileScreen', () => {
  it('renders login form', () => {
    const { getByPlaceholderText, getByText } = render(<ProfileScreen />);
    expect(getByPlaceholderText('email')).toBeTruthy();
    expect(getByPlaceholderText('phone')).toBeTruthy();
    expect(getByPlaceholderText('password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('switches to register mode', async () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('No account? Register'));
    await waitFor(() => expect(getByText('Register')).toBeTruthy());
  });
});
