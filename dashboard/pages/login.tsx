import * as React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, TextField, Button, Box, Alert } from '@mui/material';
import { useAuth } from '../src/auth';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.push('/');
    } else {
      setError('Invalid credentials or not an admin.');
    }
  };

  return (
    <DashboardLayout>
      <Typography variant="h5" gutterBottom>
        Admin Login
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mt: 2 }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Box>
    </DashboardLayout>
  );
}
