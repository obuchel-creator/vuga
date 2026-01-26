import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminScreen from './AdminScreen';

describe('AdminScreen', () => {
  it('renders admin title', async () => {
    const { getByText } = render(<AdminScreen />);
    await waitFor(() => expect(getByText('Admin Tools')).toBeTruthy());
  });
});
