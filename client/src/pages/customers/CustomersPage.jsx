import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Grid, Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { customersApi, provincesApi, regionsApi } from '../../services';

const emptyForm = {
  company_name: '', contact_name: '', phone: '', email: '', address: '',
  province_id: '', region_id: '', credit_terms: 30, discount_percent: 0, credit_limit: 0, is_active: true
};

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getAll({ q: search || undefined });
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    provincesApi.getAll().then((r) => setProvinces(r.data.data || []));
    regionsApi.getAll().then((r) => setRegions(r.data.data || []));
    fetchData();
  }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ company_name: item.company_name, contact_name: item.contact_name || '', phone: item.phone || '', email: item.email || '',
      address: item.address || '', province_id: item.province_id || '', region_id: item.region_id || '',
      credit_terms: item.credit_terms, discount_percent: item.discount_percent, credit_limit: item.credit_limit, is_active: Boolean(item.is_active) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, province_id: form.province_id || null, region_id: form.region_id || null };
      if (editItem) { await customersApi.update(editItem.id, payload); showSnack('อัพเดตสำเร็จ'); }
      else { await customersApi.create(payload); showSnack('เพิ่มข้อมูลสำเร็จ'); }
      setDialogOpen(false); fetchData();
    } catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await customersApi.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const columns = [
    { field: 'customer_code', headerName: 'รหัส', width: 120 },
    { field: 'company_name', headerName: 'ชื่อร้านค้า/บริษัท', flex: 1 },
    { field: 'contact_name', headerName: 'ผู้ติดต่อ', width: 150 },
    { field: 'phone', headerName: 'โทรศัพท์', width: 130 },
    { field: 'province_name', headerName: 'จังหวัด', width: 130 },
    { field: 'region_name', headerName: 'ภูมิภาค', width: 130 },
    { field: 'credit_terms', headerName: 'เครดิต (วัน)', width: 100 },
    {
      field: 'is_active', headerName: 'สถานะ', width: 100,
      renderCell: (p) => <Chip label={p.value ? 'ใช้งาน' : 'ปิด'} color={p.value ? 'success' : 'default'} size="small" />
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="แก้ไข"><IconButton size="small" onClick={() => openEdit(p.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="ลบ"><IconButton size="small" color="error" onClick={() => setDeleteId(p.row.id)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    }
  ];

  const filtered = rows.filter((r) =>
    r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">ร้านค้า/ลูกค้า (Customers)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่ม</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <TextField placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 2, width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="ชื่อร้านค้า/บริษัท" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} required fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="ชื่อผู้ติดต่อ" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="เบอร์โทร" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="อีเมล" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="ที่อยู่" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} multiline rows={2} fullWidth /></Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete options={provinces} getOptionLabel={(o) => o.name_th} value={provinces.find((p) => p.id === form.province_id) || null}
                  onChange={(_, v) => setForm((p) => ({ ...p, province_id: v?.id || '' }))}
                  renderInput={(params) => <TextField {...params} label="จังหวัด" />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="ภูมิภาค" value={form.region_id} onChange={(e) => setForm((p) => ({ ...p, region_id: e.target.value }))} fullWidth>
                  <MenuItem value="">-</MenuItem>
                  {regions.map((r) => <MenuItem key={r.id} value={r.id}>{r.name_th}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}><TextField label="เครดิต (วัน)" type="number" value={form.credit_terms} onChange={(e) => setForm((p) => ({ ...p, credit_terms: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} sm={4}><TextField label="ส่วนลด (%)" type="number" value={form.discount_percent} onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} sm={4}><TextField label="วงเงินเครดิต (บาท)" type="number" value={form.credit_limit} onChange={(e) => setForm((p) => ({ ...p, credit_limit: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบลูกค้านี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
