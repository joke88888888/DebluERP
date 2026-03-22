import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Avatar, Tooltip,
  InputAdornment, CircularProgress, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CloudUpload } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { modelsApi, brandsApi } from '../../services';

export default function ModelsPage() {
  const [rows, setRows] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', brand_id: '', description: '', is_active: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await modelsApi.getAll({ brand_id: filterBrand || undefined });
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    brandsApi.getAll({ is_active: 'true' }).then((r) => setBrands(r.data.data || []));
  }, []);

  useEffect(() => { fetchData(); }, [filterBrand]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ code: '', name: '', brand_id: '', description: '', is_active: true });
    setImageFile(null);
    setImagePreview('');
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ code: item.code, name: item.name, brand_id: item.brand_id, description: item.description || '', is_active: Boolean(item.is_active) });
    setImageFile(null);
    setImagePreview(item.model_image ? `/uploads/${item.model_image}` : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('code', form.code);
      fd.append('name', form.name);
      fd.append('brand_id', form.brand_id);
      fd.append('description', form.description);
      fd.append('is_active', form.is_active ? '1' : '0');
      if (imageFile) fd.append('file', imageFile);

      if (editItem) {
        await modelsApi.update(editItem.id, fd);
        showSnack('อัพเดตสำเร็จ');
      } else {
        await modelsApi.create(fd);
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
      await modelsApi.remove(deleteId);
      showSnack('ลบข้อมูลสำเร็จ');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const columns = [
    { field: 'code', headerName: 'รหัส', width: 80 },
    { field: 'brand_name', headerName: 'แบรนด์', width: 120 },
    {
      field: 'model_image', headerName: 'รูป', width: 80,
      renderCell: (p) => <Avatar src={p.value ? `/uploads/${p.value}` : ''} variant="rounded">{p.row.name[0]}</Avatar>
    },
    { field: 'name', headerName: 'ชื่อรุ่น', flex: 1 },
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
        <Typography variant="h5" fontWeight="bold">รุ่น (Models)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่ม</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box display="flex" gap={2} mb={2}>
          <TextField placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 250 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <TextField select label="กรองตามแบรนด์" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} size="small" sx={{ width: 200 }}>
            <MenuItem value="">ทั้งหมด</MenuItem>
            {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Box>
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขรุ่น' : 'เพิ่มรุ่น'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField select label="แบรนด์" value={form.brand_id} onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value }))} required>
              {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
            <TextField label="รหัส (5 ตัวอักษร)" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required inputProps={{ maxLength: 5 }} />
            <TextField label="ชื่อรุ่น" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="คำอธิบาย" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline rows={2} />
            <Box>
              <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                อัพโหลดรูป
                <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              </Button>
              {imagePreview && <Avatar src={imagePreview} variant="rounded" sx={{ mt: 1, width: 64, height: 64 }} />}
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

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบรุ่นนี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
