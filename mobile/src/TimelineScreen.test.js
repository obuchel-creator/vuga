import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TimelineScreen from './TimelineScreen';

jest.mock('axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('TimelineScreen', () => {
  it('renders timeline title', async () => {
    const { getByText } = render(<TimelineScreen />);
    await waitFor(() => expect(getByText('Reports Timeline')).toBeTruthy());
  });
});
