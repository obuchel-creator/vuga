import { useEffect, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Box, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
  // Prepare chart data: payments per provider
  const chartData = [
    { provider: 'MTN', count: payments.filter(p => p.provider === 'mtn').length, amount: payments.filter(p => p.provider === 'mtn').reduce((sum, p) => sum + p.amount, 0) },
    { provider: 'Airtel', count: payments.filter(p => p.provider === 'airtel').length, amount: payments.filter(p => p.provider === 'airtel').reduce((sum, p) => sum + p.amount, 0) },
  ];
import { saveAs } from 'file-saver';
  const exportCSV = () => {
    const header = ['ID', 'User ID', 'Provider', 'Amount', 'Paid', 'Expiry', 'Transaction ID', 'Created'];
    const rows = payments.map(p => [p.id, p.userId, p.provider, p.amount, p.paid ? 'Yes' : 'No', p.expiry, p.transactionId, p.created_at]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `payments-${new Date().toISOString().slice(0,10)}.csv`);
  };
import withAdminAuth from '../src/withAdminAuth';
import axios from 'axios';

interface Payment {
  id: number;
  userId: number;
  provider: string;
  amount: number;
  expiry: string;
  paid: boolean;
  transactionId: string;
  created_at: string;
}

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/payments')
      .then(res => {
        setPayments(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch payments');
        setLoading(false);
      });
  }, []);

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidCount = payments.filter(p => p.paid).length;
  const mtnCount = payments.filter(p => p.provider === 'mtn').length;
  const airtelCount = payments.filter(p => p.provider === 'airtel').length;

  return (
    <DashboardLayout>
      <Typography variant="h5" gutterBottom>
        Payments Analytics
      </Typography>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography>Total Payments: {payments.length}</Typography>
              <Typography>Total Amount: UGX {totalAmount.toLocaleString()}</Typography>
              <Typography>Paid: {paidCount}</Typography>
              <Typography>MTN: {mtnCount} | Airtel: {airtelCount}</Typography>
            </Box>
            <Button variant="outlined" onClick={exportCSV} disabled={payments.length === 0}>
              Export CSV
            </Button>
          </Box>
          <Box sx={{ width: '100%', height: 300, mb: 3 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="provider" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1976d2" name="Payments Count" />
                <Bar dataKey="amount" fill="#82ca9d" name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.id}</TableCell>
                    <TableCell>{payment.userId}</TableCell>
                    <TableCell>{payment.provider}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>{payment.paid ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{payment.expiry}</TableCell>
                    <TableCell>{payment.transactionId}</TableCell>
                    <TableCell>{payment.created_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </DashboardLayout>
  );
}

export default withAdminAuth(PaymentsPage);
