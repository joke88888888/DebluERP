import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Table, TableHead, TableRow,
  TableCell, TableBody, Divider, Stack, Card
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, AddCircleOutline, RemoveCircleOutline, ViewInAr } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { floorMoldsApi, lidMoldsApi, brandsApi, sizesApi } from '../../services';

const newSizeRow = () => ({ _id: Math.random(), size_id: '', quantity: 1 });

export default function FloorMoldsPage() {
  const [rows, setRows] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [lidMolds, setLidMolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ brand_id: '', name: '', lid_mold_id: '', is_active: true });
  const [sizeRows, setSizeRows] = useState([newSizeRow()]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await floorMoldsApi.getAll();
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    brandsApi.getAll({ is_active: 'true' }).then(r => setBrands(r.data.data || []));
    sizesApi.getAll({ is_active: 'true' }).then(r => setSizes(r.data.data || []));
    lidMoldsApi.getAll({ is_active: 'true' }).then(r => setLidMolds(r.data.data || []));
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ brand_id: '', name: '', lid_mold_id: '', is_active: true });
    setSizeRows([newSizeRow()]);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ brand_id: item.brand_id, name: item.name, lid_mold_id: item.lid_mold_id || '', is_active: Boolean(item.is_active) });
    setSizeRows(item.sizes?.length > 0 ? item.sizes.map(s => ({ _id: Math.random(), size_id: s.size_id, quantity: s.quantity })) : [newSizeRow()]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.brand_id || !form.name) return showSnack('กรุณากรอกข้อมูลให้ครบ', 'error');
    setSaving(true);
    try {
      const payload = {
        brand_id: form.brand_id,
        name: form.name,
        lid_mold_id: form.lid_mold_id || null,
        is_active: form.is_active,
        sizes: sizeRows.filter(s => s.size_id).map(s => ({ size_id: s.size_id, quantity: Number(s.quantity) || 1 }))
      };
      if (editItem) { await floorMoldsApi.update(editItem.id, payload); showSnack('อัพเดตสำเร็จ'); }
      else { await floorMoldsApi.create(payload); showSnack('เพิ่มข้อมูลสำเร็จ'); }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await floorMoldsApi.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const columns = [
    { field: 'brand_name', headerName: 'แบรนด์', width: 130 },
    { field: 'name', headerName: 'พื้นโมล์', width: 120 },
    { field: 'lid_mold_name', headerName: 'แบบฝาโมล์', width: 180, renderCell: p => p.value || <Typography variant="caption" color="text.disabled">-</Typography> },
    {
      field: 'sizes', headerName: 'ขนาด', flex: 1,
      renderCell: (p) => {
        const arr = p.value || [];
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
            {arr.map((s, i) => {
              const sz = sizes.find(x => x.id == s.size_id);
              return <Chip key={i} size="small" label={`${sz?.size_value || s.size_id} × ${s.quantity}`} variant="outlined" color="secondary" />;
            })}
            {arr.length === 0 && <Typography variant="caption" color="text.disabled">-</Typography>}
          </Box>
        );
      }
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

  const filtered = rows.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.brand_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'secondary.main', display: 'flex' }}>
            <ViewInAr sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>พื้นโมล์</Typography>
            <Typography variant="body2" color="text.secondary">จัดการข้อมูลแบบพื้นโมล์</Typography>
          </Box>
        </Box>
        <Button variant="contained" color="secondary" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>เพิ่มพื้นโมล์</Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <TextField placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        </Box>
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight rowHeight={56}
          pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{editItem ? 'แก้ไขพื้นโมล์' : 'เพิ่มพื้นโมล์'}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField select label="แบรนด์ *" value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))} fullWidth>
              {brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
            <TextField label="พื้นโมล์ (ไม่เกิน 5 ตัวอักษร) *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              inputProps={{ maxLength: 5 }} helperText={`${form.name.length}/5 ตัวอักษร`} fullWidth />
            <TextField select label="แบบฝาโมล์" value={form.lid_mold_id} onChange={e => setForm(p => ({ ...p, lid_mold_id: e.target.value }))} fullWidth>
              <MenuItem value="">- ไม่ระบุ -</MenuItem>
              {lidMolds.map(l => <MenuItem key={l.id} value={l.id}>{l.name} ({l.brand_name})</MenuItem>)}
            </TextField>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>ขนาดและจำนวน</Typography>
                <Button size="small" startIcon={<AddCircleOutline />} onClick={() => setSizeRows(p => [...p, newSizeRow()])}>เพิ่มขนาด</Button>
              </Box>
              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>ขนาด</TableCell>
                      <TableCell width={100}>จำนวน</TableCell>
                      <TableCell width={50} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sizeRows.map((row, idx) => (
                      <TableRow key={row._id}>
                        <TableCell>
                          <TextField select value={row.size_id} onChange={e => setSizeRows(p => { const n = [...p]; n[idx] = { ...n[idx], size_id: e.target.value }; return n; })} size="small" fullWidth>
                            {sizes.map(s => <MenuItem key={s.id} value={s.id}>{s.size_value}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField type="number" value={row.quantity} onChange={e => setSizeRows(p => { const n = [...p]; n[idx] = { ...n[idx], quantity: e.target.value }; return n; })} size="small" fullWidth inputProps={{ min: 1 }} />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => setSizeRows(p => p.filter((_, i) => i !== idx))} disabled={sizeRows.length === 1}>
                            <RemoveCircleOutline fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Box>
            <FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving} sx={{ minWidth: 100 }}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบพื้นโมล์นี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
