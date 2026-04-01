import * as React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, IconButton, Select, MenuItem, Button } from '@mui/material';
import { saveAs } from 'file-saver';
import { useNotification } from '../src/notification';
  const exportCSV = () => {
    const header = ['ID', 'Email', 'Phone', 'Role', 'Created'];
    const rows = filteredUsers.map(u => [u.id, u.email, u.phone, u.role, u.created_at]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `users-${new Date().toISOString().slice(0,10)}.csv`);
  };
import DeleteIcon from '@mui/icons-material/Delete';
import withAdminAuth from '../src/withAdminAuth';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

function UsersPage() {

  const [users, setUsers] = useState<User[]>([]);
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    axios.get('/api/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user?')) return;
    setUpdating(id);
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
      notify('User deleted', 'success');
    } catch {
      setError('Failed to delete user');
      notify('Failed to delete user', 'error');
    }
    setUpdating(null);
  };

  const handleRoleChange = async (id: number, role: string) => {
    setUpdating(id);
    try {
      await axios.put(`/api/users/${id}`, { role });
      fetchUsers();
      notify('Role updated', 'success');
    } catch {
      setError('Failed to update role');
      notify('Failed to update role', 'error');
    }
    setUpdating(null);
  };

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Typography variant="h5" gutterBottom>
        Users
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
        <TextField
          label="Search by email or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button variant="outlined" onClick={exportCSV} disabled={filteredUsers.length === 0}>
          Export CSV
        </Button>
      </Box>
      {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      size="small"
                      disabled={updating === user.id}
                    >
                      <MenuItem value="admin">admin</MenuItem>
                      <MenuItem value="moderator">moderator</MenuItem>
                      <MenuItem value="user">user</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{user.created_at}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(user.id)} disabled={updating === user.id}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DashboardLayout>
  );
}

export default withAdminAuth(UsersPage);
