import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BadgesScreen from './BadgesScreen';

jest.mock('axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('BadgesScreen', () => {
  it('renders badges and progress', async () => {
    const { getByText } = render(<BadgesScreen userId={1} />);
    await waitFor(() => expect(getByText('First Report')).toBeTruthy());
    expect(getByText('Reporter 5')).toBeTruthy();
  });
});
