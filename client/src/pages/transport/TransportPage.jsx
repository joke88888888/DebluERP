import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Paper, Typography, Chip, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment, Alert, Snackbar, Switch, FormControlLabel, Divider, Grid
} from '@mui/material';
import { Add, Edit, Search, LocalShipping } from '@mui/icons-material';
import api from '../../utils/api';

const TYPE_LABELS = { company: 'บริษัทขนส่ง', hired_truck: 'รถรับจ้าง', internal: 'ภายใน' };
const TYPE_COLORS = { company: 'primary', hired_truck: 'warning', internal: 'success' };

const emptyForm = { company_name: '', type: 'company', tax_id: '', address: '', phone: '', email: '', contact_person: '', is_active: true };

export default function TransportPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transport', { params: { q } });
      setRows(res.data.data || []);
    } catch { showSnack('โหลดข้อมูลล้มเหลว', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [q]);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ company_name: item.company_name, type: item.type, tax_id: item.tax_id || '', address: item.address || '', phone: item.phone || '', email: item.email || '', contact_person: item.contact_person || '', is_active: !!item.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) await api.put(`/transport/${editItem.id}`, form);
      else await api.post('/transport', form);
      showSnack(editItem ? 'อัพเดตสำเร็จ' : 'เพิ่มสำเร็จ');
      setDialogOpen(false);
      fetch();
    } catch (e) { showSnack(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <LocalShipping sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5">Master ขนส่ง</Typography>
          <Typography variant="body2" color="text.secondary">จัดการข้อมูลบริษัทขนส่ง</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <TextField placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ width: 240 }} />
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่มขนส่ง</Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>รหัส</TableCell>
              <TableCell>ชื่อบริษัท</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>เบอร์โทร</TableCell>
              <TableCell>ผู้ติดต่อ</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell width={60} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{r.transport_code}</Typography></TableCell>
                <TableCell><Typography fontWeight={600}>{r.company_name}</Typography></TableCell>
                <TableCell><Chip label={TYPE_LABELS[r.type] || r.type} color={TYPE_COLORS[r.type] || 'default'} size="small" /></TableCell>
                <TableCell>{r.phone || '-'}</TableCell>
                <TableCell>{r.contact_person || '-'}</TableCell>
                <TableCell><Chip label={r.is_active ? 'ใช้งาน' : 'ปิด'} color={r.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขขนส่ง' : 'เพิ่มขนส่ง'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}><TextField label="ชื่อบริษัทขนส่ง *" value={form.company_name} onChange={setF('company_name')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="ประเภท" value={form.type} onChange={setF('type')} fullWidth>
                <MenuItem value="company">บริษัทขนส่ง</MenuItem>
                <MenuItem value="hired_truck">รถรับจ้าง</MenuItem>
                <MenuItem value="internal">ภายใน</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="เลขผู้เสียภาษี" value={form.tax_id} onChange={setF('tax_id')} fullWidth /></Grid>
            <Grid item xs={12}><TextField label="ที่อยู่" value={form.address} onChange={setF('address')} fullWidth multiline rows={2} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="เบอร์โทร" value={form.phone} onChange={setF('phone')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" value={form.email} onChange={setF('email')} fullWidth /></Grid>
            <Grid item xs={12}><TextField label="ผู้ติดต่อ" value={form.contact_person} onChange={setF('contact_person')} fullWidth /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" /></Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.company_name}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
