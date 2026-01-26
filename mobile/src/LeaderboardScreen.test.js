import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LeaderboardScreen from './LeaderboardScreen';

jest.mock('axios', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }));

describe('LeaderboardScreen', () => {
  it('renders leaderboard title', async () => {
    const { getByText } = render(<LeaderboardScreen />);
    await waitFor(() => expect(getByText('Leaderboard')).toBeTruthy());
  });
});
