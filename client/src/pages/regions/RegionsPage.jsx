import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { regionsApi, provincesApi } from '../../services';

export default function RegionsPage() {
  const [rows, setRows] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', name_th: '', description: '', is_active: true });
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await regionsApi.getAll();
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    provincesApi.getAll().then((r) => setProvinces(r.data.data || []));
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', name_th: '', description: '', is_active: true });
    setSelectedProvinces([]);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, name_th: item.name_th, description: item.description || '', is_active: Boolean(item.is_active) });
    setSelectedProvinces(item.provinces || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, province_ids: selectedProvinces.map((p) => p.id) };
      if (editItem) {
        await regionsApi.update(editItem.id, payload);
        showSnack('อัพเดตสำเร็จ');
      } else {
        await regionsApi.create(payload);
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
      await regionsApi.remove(deleteId);
      showSnack('ลบข้อมูลสำเร็จ');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const columns = [
    { field: 'name_th', headerName: 'ชื่อภูมิภาค (TH)', flex: 1 },
    { field: 'name', headerName: 'ชื่อภูมิภาค (EN)', flex: 1 },
    {
      field: 'provinces', headerName: 'จังหวัด', flex: 2,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(p.value || []).slice(0, 3).map((pv) => <Chip key={pv.id} label={pv.name_th} size="small" />)}
          {(p.value || []).length > 3 && <Chip label={`+${p.value.length - 3}`} size="small" color="primary" />}
        </Box>
      )
    },
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
    r.name_th?.toLowerCase().includes(search.toLowerCase()) || r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">ภูมิภาค (Regions)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่ม</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <TextField placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 2, width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick getRowHeight={() => 'auto'} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขภูมิภาค' : 'เพิ่มภูมิภาค'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="ชื่อภูมิภาค (TH)" value={form.name_th} onChange={(e) => setForm((p) => ({ ...p, name_th: e.target.value }))} required />
            <TextField label="ชื่อภูมิภาค (EN)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="คำอธิบาย" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline rows={2} />
            <Autocomplete
              multiple
              options={provinces}
              getOptionLabel={(o) => `${o.name_th} (${o.name_en})`}
              value={selectedProvinces}
              onChange={(_, v) => setSelectedProvinces(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="จังหวัดในภูมิภาค" placeholder="พิมพ์เพื่อค้นหาจังหวัด" />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => <Chip label={option.name_th} size="small" {...getTagProps({ index })} />)
              }
            />
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

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบภูมิภาคนี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
