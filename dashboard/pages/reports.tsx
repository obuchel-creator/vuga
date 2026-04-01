import { useEffect, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Box, Button } from '@mui/material';
import { saveAs } from 'file-saver';
import { useNotification } from '../src/notification';
  const exportCSV = () => {
    const header = ['ID', 'Location', 'Description', 'Severity', 'Status', 'Latitude', 'Longitude', 'Created'];
    const rows = reports.map(r => [r.id, r.location, r.description, r.severity, r.status || 'pending', r.latitude, r.longitude, r.created_at]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `reports-${new Date().toISOString().slice(0,10)}.csv`);
  };
import withAdminAuth from '../src/withAdminAuth';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface Report {
  id: number;
  location: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
  status?: string;
  created_at: string;
}

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, []);

  const fetchReports = () => {
    setLoading(true);
    axios.get('/api/reports')
      .then(res => {
        setReports(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch reports');
        setLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this report?')) return;
    setUpdating(id);
    try {
      await axios.delete(`/api/reports/${id}`);
      fetchReports();
      notify('Report deleted', 'success');
    } catch {
      setError('Failed to delete report');
      notify('Failed to delete report', 'error');
    }
    setUpdating(null);
  };

  const handleApprove = async (id: number) => {
    setUpdating(id);
    try {
      await axios.put(`/api/reports/${id}`, { status: 'approved' });
      fetchReports();
      notify('Report approved', 'success');
    } catch {
      setError('Failed to approve report');
      notify('Failed to approve report', 'error');
    }
    setUpdating(null);
  };

  const handleReject = async (id: number) => {
    setUpdating(id);
    try {
      await axios.put(`/api/reports/${id}`, { status: 'rejected' });
      fetchReports();
      notify('Report rejected', 'success');
    } catch {
      setError('Failed to reject report');
      notify('Failed to reject report', 'error');
    }
    setUpdating(null);
  };

  return (
    <DashboardLayout>
      <Typography variant="h5" gutterBottom>
        Reports Moderation
      </Typography>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={exportCSV} disabled={reports.length === 0}>
              Export CSV
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>{report.description}</TableCell>
                    <TableCell>{report.severity}</TableCell>
                    <TableCell>{report.status || 'pending'}</TableCell>
                    <TableCell>{report.created_at}</TableCell>
                    <TableCell>
                      <IconButton color="success" onClick={() => handleApprove(report.id)} disabled={updating === report.id} title="Approve">
                        <CheckIcon />
                      </IconButton>
                      <IconButton color="warning" onClick={() => handleReject(report.id)} disabled={updating === report.id} title="Reject">
                        <CloseIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(report.id)} disabled={updating === report.id} title="Delete">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
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

export default withAdminAuth(ReportsPage);
