import * as React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography } from '@mui/material';

export default function Home() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Welcome to the Admin Dashboard
      </Typography>
      <Typography>
        Use the navigation to manage users, payments, and reports.
      </Typography>
    </DashboardLayout>
  );
}
