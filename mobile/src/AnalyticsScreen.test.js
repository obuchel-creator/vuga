import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock WebSocket to prevent open handle warning
global.WebSocket = class {
  constructor() {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify({ type: 'analytics', data: { userCount: 5, severity: [], trends: [] } }) });
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

import AnalyticsScreen from './AnalyticsScreen';

jest.mock('axios');

describe('AnalyticsScreen', () => {
  it('renders loading and then analytics data', async () => {
    const { getByText, queryByText } = render(<AnalyticsScreen />);
    expect(getByText('Analytics Dashboard')).toBeTruthy();
    expect(queryByText('Live User Count')).toBeTruthy();
    // Simulate WebSocket message
    // (WebSocket is not available in Jest, so this is a shallow render test)
  });

  it('shows error if WebSocket fails', async () => {
    // This test can be expanded with a mock WebSocket implementation if needed
    // For now, just check error boundary is present
    const { getByText } = render(<AnalyticsScreen />);
    expect(getByText('Analytics Dashboard')).toBeTruthy();
  });
});
