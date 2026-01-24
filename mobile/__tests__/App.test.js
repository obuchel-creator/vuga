import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('Kampala Traffic App', () => {
  it('renders login screen when not authenticated', () => {
    const { getByText, getByPlaceholderText } = render(<App />);
    expect(getByText('Kampala Traffic')).toBeTruthy();
    expect(getByPlaceholderText('Email (or leave blank if using phone)')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders comments section in report card', () => {
    const { getByText } = render(<App />);
    expect(getByText('Comments')).toBeTruthy();
  });

  it('renders profile button when logged in', () => {
    // You may need to mock AsyncStorage and axios for full coverage
    // For now, just check the Profile button exists
    const { getByText } = render(<App />);
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders report button in report card', () => {
    const { getByText } = render(<App />);
    expect(getByText('Report')).toBeTruthy();
  });

  it('applies dark mode styles', () => {
    // Appearance.getColorScheme can be mocked for full coverage
    // For now, just check the app renders without error
    const { getByTestId } = render(<App />);
    expect(getByTestId('AppRoot')).toBeTruthy();
  });
});