import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>Deblu ERP</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>ระบบ ERP โรงงานผลิตรองเท้า</Typography>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="ชื่อผู้ใช้" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth sx={{ mb: 3 }} required />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'เข้าสู่ระบบ'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
