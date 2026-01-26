
// Robust mock for SafeAreaProvider and context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => <>{children}</>,
    SafeAreaInsetsContext: {
      Consumer: ({ children }) => children({ top: 0, bottom: 0, left: 0, right: 0 }),
      Provider: ({ children }) => children,
    },
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('axios', () => {
  // Stateful mock for reports and comments
  const state = {
    _reports: [
      { id: 1, location: 'Test Location', description: 'Test Description', severity: 'low', latitude: 0.1, longitude: 0.2 }
    ],
    _comments: { 1: [ { text: 'Test comment' } ] }
  };
  return {
    get: jest.fn(function (url) {
      // Return all reports for /api/reports (with or without trailing slash)
      if (url && /\/api\/reports\/?($|\?)/i.test(url)) {
        return Promise.resolve({ data: state._reports });
      }
      // Return comments for a report
      const match = url && url.match(/\/api\/reports\/(\d+)\/comments/i);
      if (match) {
        const reportId = parseInt(match[1], 10);
        return Promise.resolve({ data: state._comments[reportId] || [] });
      }
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn(function (url, data) {
      if (url && url.toLowerCase().includes('login')) {
        return Promise.resolve({ data: { user: { id: 1, email: data.email, phone: data.phone } } });
      }
      // Simulate report submission
      if (url && /\/api\/reports\/?($|\?)/i.test(url)) {
        const newReport = {
          id: state._reports.length + 1,
          location: data.location,
          description: data.description,
          severity: data.severity || 'low',
          latitude: data.latitude || 0.1,
          longitude: data.longitude || 0.2
        };
        state._reports.push(newReport);
        // Add a sample comment for this report
        state._comments[newReport.id] = [ { text: 'Test comment' } ];
        return Promise.resolve({ data: newReport });
      }
      // Simulate adding a comment
      const match = url && url.match(/\/api\/reports\/(\d+)\/comments/i);
      if (match) {
        const reportId = parseInt(match[1], 10);
        if (!state._comments[reportId]) state._comments[reportId] = [];
        state._comments[reportId].push({ text: data.text });
        return Promise.resolve({ data: { text: data.text } });
      }
      return Promise.resolve({ data: {} });
    })
  };
});
global.WebSocket = function () { this.close = jest.fn(); this.send = jest.fn(); this.addEventListener = jest.fn(); this.removeEventListener = jest.fn(); this.readyState = 1; };

import * as ReactNative from 'react-native';
import React from 'react';
import { render, fireEvent, waitFor, act, getByDisplayValue } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import { Alert } from 'react-native';
beforeAll(() => {
  jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async (key) => {
    if (key === 'tutorialSeen') return 'true';
    return null;
  });
  jest.spyOn(ReactNative.Alert, 'alert').mockImplementation((title, message, buttons) => {
    ReactNative.Alert._lastAlert = { title, message, buttons };
    if (buttons && Array.isArray(buttons) && buttons[0] && typeof buttons[0].onPress === 'function') {
      buttons[0].onPress();
    }
  });
  ReactNative.Alert.getLastAlert = () => ReactNative.Alert._lastAlert;
  ReactNative.Alert.clearLastAlert = () => { ReactNative.Alert._lastAlert = null; };
});

describe('Kampala Traffic App', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      AsyncStorage.getItem.mockImplementation(async (key) => {
        if (key === 'tutorialSeen') return 'true';
        return null;
      });
      AsyncStorage.setItem.mockResolvedValue();
      AsyncStorage.removeItem.mockResolvedValue();
    });
  it('renders login screen and switches to register', async () => {
    const { getByText, queryByText } = render(<App />);
    // Robust tutorial modal dismissal: press 'Next' as long as present, then 'Skip' as long as present, then wait for all modal-related texts/buttons to disappear
    let modalSafety = 15;
    await act(async () => {
      while (modalSafety-- > 0 && (queryByText('Next') || queryByText('Skip') || queryByText('Welcome to Kampala Traffic') || queryByText('This app helps you report and view traffic jams in real time. Tap Next to continue.'))) {
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
    await waitFor(() => expect(getByText('Vuga')).toBeTruthy());
    fireEvent.press(getByText('No account? Register'));
    await waitFor(() => expect(getByText('Register')).toBeTruthy());
    fireEvent.press(getByText('Have an account? Login'));
    await waitFor(() => expect(getByText('Login')).toBeTruthy());
  });


  it('shows validation error for empty report', async () => {
    const { getByText, getByPlaceholderText, queryByText, getByTestId, getByDisplayValue } = render(<App />);
    // Simulate map press to set latitude and longitude
    let map;
    try {
      map = getByTestId('map');
    } catch {}
    if (map) {
      fireEvent(map, 'press', { nativeEvent: { coordinate: { latitude: 0.1, longitude: 0.2 } } });
    }
    // Wait for loading to finish
    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
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
    // Navigate to Reports tab
    await act(async () => {
      fireEvent.press(getByText('Reports'));
    });
    // Wait for the form to be present
    await waitFor(() => expect(getByPlaceholderText('Location')).toBeTruthy());
    await waitFor(() => expect(getByPlaceholderText('Description')).toBeTruthy());
    // Simulate a report submission to ensure a report is rendered
    fireEvent.changeText(getByPlaceholderText('Location'), 'Test Location');
    fireEvent.changeText(getByPlaceholderText('Description'), 'Test Description');
    // Set severity if needed (default is 'low')
    fireEvent.press(getByText('Submit'));
    // Wait for the sample report to appear
    await waitFor(() => expect(getByDisplayValue('Test Location')).toBeTruthy());
    // Debug output after report appears
    // eslint-disable-next-line no-console
    if (typeof debug === 'function') debug();
    // Wait for Comments: label to appear (allowing for async comments fetch)
    await waitFor(() => expect(getByText('Comments:')).toBeTruthy(), { timeout: 4000 });
    // Step 2: Clear the fields and submit (should trigger validation alert)
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Location'), '');
      fireEvent.changeText(getByPlaceholderText('Description'), '');
    });
    ReactNative.Alert.clearLastAlert && ReactNative.Alert.clearLastAlert();
    // The Submit button should be disabled when fields are empty
    const submitButton = getByText('Submit');
    fireEvent.press(submitButton);
    // Assert that the validation alert is shown
    const lastAlert = ReactNative.Alert.getLastAlert && ReactNative.Alert.getLastAlert();
    expect(lastAlert && lastAlert.title).toBe('Validation');
  });
});