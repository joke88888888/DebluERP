import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Divider, Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, ViewList } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { modelsApi, brandsApi, floorMoldsApi } from '../../services';

export default function ModelsPage() {
  const [rows, setRows] = useState([]);
  const [brands, setBrands] = useState([]);
  const [floorMolds, setFloorMolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', brand_id: '', floor_mold_id: '', description: '', is_active: true });
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
    } finally { setLoading(false); }
  };

  useEffect(() => {
    brandsApi.getAll({ is_active: 'true' }).then(r => setBrands(r.data.data || []));
    floorMoldsApi.getAll({ is_active: 'true' }).then(r => setFloorMolds(r.data.data || []));
  }, []);

  useEffect(() => { fetchData(); }, [filterBrand]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ code: '', name: '', brand_id: '', floor_mold_id: '', description: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      code: item.code, name: item.name, brand_id: item.brand_id,
      floor_mold_id: item.floor_mold_id || '', description: item.description || '', is_active: Boolean(item.is_active)
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code, name: form.name, brand_id: form.brand_id,
        floor_mold_id: form.floor_mold_id || null,
        description: form.description, is_active: form.is_active ? 1 : 0
      };
      if (editItem) { await modelsApi.update(editItem.id, payload); showSnack('อัพเดตสำเร็จ'); }
      else { await modelsApi.create(payload); showSnack('เพิ่มข้อมูลสำเร็จ'); }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await modelsApi.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const columns = [
    { field: 'code', headerName: 'รหัส', width: 90 },
    { field: 'brand_name', headerName: 'แบรนด์', width: 130 },
    { field: 'name', headerName: 'ชื่อรุ่น', flex: 1 },
    { field: 'floor_mold_name', headerName: 'พื้นโมล์', width: 140,
      renderCell: p => p.value ? <Chip label={p.value} size="small" variant="outlined" color="secondary" /> : <Typography variant="caption" color="text.disabled">-</Typography>
    },
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

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', display: 'flex' }}>
            <ViewList sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>รุ่น (Models)</Typography>
            <Typography variant="body2" color="text.secondary">จัดการข้อมูลรุ่นสินค้า</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>เพิ่มรุ่น</Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', gap: 2 }}>
          <TextField placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ width: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <TextField select label="กรองตามแบรนด์" value={filterBrand} onChange={e => setFilterBrand(e.target.value)} size="small" sx={{ width: 200 }}>
            <MenuItem value="">ทั้งหมด</MenuItem>
            {brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Box>
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight rowHeight={52}
          pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{editItem ? 'แก้ไขรุ่น' : 'เพิ่มรุ่น'}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField select label="แบรนด์ *" value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))} required fullWidth>
              {brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
            <TextField label="รหัส (5 ตัวอักษร) *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required inputProps={{ maxLength: 5 }} fullWidth />
            <TextField label="ชื่อรุ่น *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required fullWidth />
            <TextField select label="พื้นโมล์" value={form.floor_mold_id} onChange={e => setForm(p => ({ ...p, floor_mold_id: e.target.value }))} fullWidth>
              <MenuItem value="">- ไม่ระบุ -</MenuItem>
              {floorMolds.map(f => <MenuItem key={f.id} value={f.id}>{f.name} ({f.brand_name})</MenuItem>)}
            </TextField>
            <TextField label="คำอธิบาย" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline rows={2} fullWidth />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ minWidth: 100 }}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบรุ่นนี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
