import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Divider, Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import ConfirmDialog from './ConfirmDialog';
import AppSnackbar from './Snackbar';
import useSnackbar from '../../hooks/useSnackbar';

/**
 * Generic CRUD page for simple master data tables.
 * Props:
 *   title: string
 *   icon: ReactNode (optional)
 *   subtitle: string (optional)
 *   api: { getAll, create, update, remove }
 *   fields: [{ name, label, required, type?, options? }]
 *   extraColumns: DataGrid columns (optional)
 */
export default function SimpleCrudPage({ title, icon, subtitle, api: apiObj, fields, extraColumns = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiObj.getAll();
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    const defaults = {};
    fields.forEach((f) => { defaults[f.name] = f.default !== undefined ? f.default : ''; });
    defaults.is_active = true;
    setEditItem(null);
    setForm(defaults);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const f = {};
    fields.forEach((field) => { f[field.name] = item[field.name] !== undefined ? item[field.name] : ''; });
    f.is_active = item.is_active !== undefined ? Boolean(item.is_active) : true;
    setForm(f);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) { await apiObj.update(editItem.id, form); showSnack('อัพเดตสำเร็จ'); }
      else { await apiObj.create(form); showSnack('เพิ่มข้อมูลสำเร็จ'); }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await apiObj.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const filtered = rows.filter((r) =>
    Object.values(r).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const autoColumns = [
    ...fields.map((f) => ({ field: f.name, headerName: f.label, flex: 1, minWidth: 120 })),
    {
      field: 'is_active', headerName: 'สถานะ', width: 100,
      renderCell: (p) => <Chip label={p.value ? 'ใช้งาน' : 'ปิด'} color={p.value ? 'success' : 'default'} size="small" />
    },
    ...extraColumns,
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

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && (
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', display: 'flex' }}>
              {React.cloneElement(icon, { sx: { color: 'white', fontSize: 28 } })}
            </Box>
          )}
          <Box>
            <Typography variant="h5" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>เพิ่ม</Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <TextField placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        </Box>
        <DataGrid rows={filtered} columns={autoColumns} loading={loading} autoHeight rowHeight={52}
          pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{editItem ? `แก้ไข${title}` : `เพิ่ม${title}`}</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {fields.map((f) => (
              <TextField key={f.name} label={f.label} value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                required={f.required} multiline={f.multiline} rows={f.multiline ? 3 : 1}
                type={f.options ? undefined : (f.type || 'text')} fullWidth select={Boolean(f.options)}
                InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}>
                {f.options && f.options.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
            ))}
            <FormControlLabel control={<Switch checked={Boolean(form.is_active)} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" />
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

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบข้อมูลนี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
