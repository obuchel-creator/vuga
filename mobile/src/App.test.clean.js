import * as ReactNative from 'react-native';
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn((url, data) => {
    if (url && url.toLowerCase().includes('login')) {
      return Promise.resolve({ data: { user: { id: 1, email: data.email, phone: data.phone } } });
    }
    return Promise.resolve({ data: {} });
  })
}));
global.WebSocket = function () { this.close = jest.fn(); this.send = jest.fn(); this.addEventListener = jest.fn(); this.removeEventListener = jest.fn(); this.readyState = 1; };

beforeAll(() => {
  jest.spyOn(ReactNative, 'useColorScheme').mockImplementation(() => 'light');
  jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async (key) => {
    if (key === 'tutorialSeen') return 'true';
    return null;
  });
});

describe('Kampala Traffic App UI', () => {
  it('renders login screen and switches to register', async () => {
    const { getByText, queryByText } = render(<App />);
    // Robust tutorial modal dismissal: press 'Next' as long as present, then 'Skip' as long as present, then wait for all modal-related texts/buttons to disappear
    let modalSafety = 15;
    await act(async () => {
      while (modalSafety-- > 0 && (queryByText('Next') || queryByText('Skip') || queryByText('Welcome to Kampala Traffic') || queryByText('This app helps you report and view traffic jams in real time. Tap Next to continue.'))){
        if (queryByText('Next')) {
          fireEvent.press(getByText('Next'));
          await new Promise(res => setTimeout(res, 50));
        }
        if (queryByText('Skip')) {
          fireEvent.press(getByText('Skip'));
          await new Promise(res => setTimeout(res, 50));
        }
        // Wait for modal content to disappear
        await waitFor(() =>
          !queryByText('Welcome to Kampala Traffic') &&
          !queryByText('This app helps you report and view traffic jams in real time. Tap Next to continue.')
        );
      }
    });
    expect(getByText('Kampala Traffic')).toBeTruthy();
    fireEvent.press(getByText('No account? Register'));
    expect(getByText('Register')).toBeTruthy();
    fireEvent.press(getByText('Have an account? Login'));
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows validation error for empty report', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<App />);
    // Close tutorial modal if present
    if (queryByText('Skip')) {
      await act(async () => {
        fireEvent.press(getByText('Skip'));
      });
    }
    // Simulate login
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('phone'), '1234567890');
      fireEvent.changeText(getByPlaceholderText('password'), 'password');
      fireEvent.press(getByText('Login'));
    });
    await waitFor(() => getByText('Report Traffic Jam'));
    fireEvent.press(getByText('Submit'));
    await waitFor(() => getByText('Validation'));
    expect(getByText('Validation')).toBeTruthy();
  });
});
