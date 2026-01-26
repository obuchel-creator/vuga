import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock WebSocket to prevent open handle warning
global.WebSocket = class {
  constructor() {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify({ type: 'reports', data: [] }) });
      }
    }, 10);
  }
  close() {}
  set onmessage(fn) { this._onmessage = fn; }
  get onmessage() { return this._onmessage; }
  set onerror(fn) { this._onerror = fn; }
  get onerror() { return this._onerror; }
  set onclose(fn) { this._onclose = fn; }
  get onclose() { return this._onclose; }
};

import ReportsScreen from './ReportsScreen';

jest.mock('axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('ReportsScreen', () => {
  it('renders reports title', async () => {
    const { getByText } = render(<ReportsScreen />);
    await waitFor(() => expect(getByText('Reports')).toBeTruthy());
  });
});
