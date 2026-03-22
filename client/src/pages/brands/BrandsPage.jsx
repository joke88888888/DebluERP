import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Avatar, Tooltip,
  InputAdornment, CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CloudUpload } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { brandsApi } from '../../services';

export default function BrandsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', is_active: true });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await brandsApi.getAll({ q: search });
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ code: '', name: '', description: '', is_active: true });
    setLogoFile(null);
    setLogoPreview('');
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ code: item.code, name: item.name, description: item.description || '', is_active: Boolean(item.is_active) });
    setLogoFile(null);
    setLogoPreview(item.logo_image ? `/uploads/${item.logo_image}` : '');
    setDialogOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('code', form.code);
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('is_active', form.is_active ? '1' : '0');
      if (logoFile) fd.append('file', logoFile);

      if (editItem) {
        await brandsApi.update(editItem.id, fd);
        showSnack('อัพเดตสำเร็จ');
      } else {
        await brandsApi.create(fd);
        showSnack('เพิ่มข้อมูลสำเร็จ');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await brandsApi.remove(deleteId);
      showSnack('ลบข้อมูลสำเร็จ');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const columns = [
    { field: 'code', headerName: 'รหัส', width: 80 },
    {
      field: 'logo_image', headerName: 'โลโก้', width: 80,
      renderCell: (p) => <Avatar src={p.value ? `/uploads/${p.value}` : ''} variant="rounded">{p.row.name[0]}</Avatar>
    },
    { field: 'name', headerName: 'ชื่อแบรนด์', flex: 1 },
    { field: 'description', headerName: 'คำอธิบาย', flex: 1 },
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
    r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">แบรนด์ (Brands)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่ม</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <TextField
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 2, width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="รหัส (1 ตัวอักษร)" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required inputProps={{ maxLength: 1 }} />
            <TextField label="ชื่อแบรนด์" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="คำอธิบาย" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline rows={2} />
            <Box>
              <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                อัพโหลดโลโก้
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
              {logoPreview && <Avatar src={logoPreview} variant="rounded" sx={{ mt: 1, width: 64, height: 64 }} />}
            </Box>
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบแบรนด์นี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
