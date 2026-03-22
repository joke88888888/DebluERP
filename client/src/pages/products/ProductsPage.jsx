import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CloudUpload } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { productsApi, brandsApi, modelsApi, versionsApi, categoriesApi, productionMethodsApi, gendersApi, colorsApi, sizesApi } from '../../services';

const emptyForm = {
  brand_id: '', model_id: '', version_id: '', product_category_id: '',
  production_method_id: '', gender_id: '', color_id: '', size_id: '',
  cost_price: 0, selling_price: 0, is_active: true
};

export default function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [masters, setMasters] = useState({ brands: [], models: [], versions: [], categories: [], methods: [], genders: [], colors: [], sizes: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll();
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      brandsApi.getAll({ is_active: 'true' }),
      versionsApi.getAll({ is_active: 'true' }),
      categoriesApi.getAll({ is_active: 'true' }),
      productionMethodsApi.getAll({ is_active: 'true' }),
      gendersApi.getAll({ is_active: 'true' }),
      colorsApi.getAll({ is_active: 'true' }),
      sizesApi.getAll({ is_active: 'true' }),
    ]).then(([b, v, c, pm, g, co, s]) => {
      setMasters({
        brands: b.data.data || [], versions: v.data.data || [], categories: c.data.data || [],
        methods: pm.data.data || [], genders: g.data.data || [], colors: co.data.data || [],
        sizes: s.data.data || [], models: []
      });
    });
    fetchData();
  }, []);

  const loadModels = async (brand_id) => {
    if (!brand_id) return;
    const res = await modelsApi.getAll({ brand_id, is_active: 'true' });
    setMasters((m) => ({ ...m, models: res.data.data || [] }));
  };

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setImageFiles([]); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      brand_id: item.brand_id, model_id: item.model_id, version_id: item.version_id,
      product_category_id: item.product_category_id, production_method_id: item.production_method_id,
      gender_id: item.gender_id, color_id: item.color_id, size_id: item.size_id,
      cost_price: item.cost_price, selling_price: item.selling_price, is_active: Boolean(item.is_active)
    });
    loadModels(item.brand_id);
    setImageFiles([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await productsApi.update(editItem.id, form);
        showSnack('อัพเดตสำเร็จ');
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        imageFiles.forEach((f) => fd.append('files', f));
        await productsApi.create(fd);
        showSnack('เพิ่มสินค้าสำเร็จ');
      }
      setDialogOpen(false); fetchData();
    } catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await productsApi.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const columns = [
    {
      field: 'primary_image', headerName: 'รูป', width: 70, sortable: false,
      renderCell: (p) => p.value
        ? <img src={`http://localhost:3001/uploads/${p.value}`} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
        : <Box sx={{ width: 48, height: 48, bgcolor: 'grey.200', borderRadius: 1 }} />
    },
    { field: 'sku', headerName: 'SKU', width: 180 },
    { field: 'product_name', headerName: 'ชื่อสินค้า', flex: 1 },
    { field: 'brand_name', headerName: 'แบรนด์', width: 100 },
    { field: 'model_name', headerName: 'รุ่น', width: 120 },
    { field: 'color_name', headerName: 'สี', width: 100 },
    { field: 'size_value', headerName: 'ไซส์', width: 80 },
    { field: 'gender_name', headerName: 'เพศ', width: 80 },
    { field: 'selling_price', headerName: 'ราคาขาย', width: 100, valueFormatter: (p) => p.value?.toLocaleString() },
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
    r.sku?.toLowerCase().includes(search.toLowerCase()) || r.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">รายการสินค้า (Products)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่มสินค้า</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <TextField placeholder="ค้นหา SKU หรือชื่อสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 2, width: 350 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight rowHeight={60} pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="แบรนด์" value={form.brand_id} onChange={(e) => { setF('brand_id')(e); setForm((p) => ({ ...p, brand_id: e.target.value, model_id: '' })); loadModels(e.target.value); }} required fullWidth>
                {masters.brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="รุ่น" value={form.model_id} onChange={setF('model_id')} required fullWidth>
                {masters.models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="เวอร์ชัน" value={form.version_id} onChange={setF('version_id')} required fullWidth>
                {masters.versions.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="ประเภทสินค้า" value={form.product_category_id} onChange={setF('product_category_id')} required fullWidth>
                {masters.categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="วิธีการผลิต" value={form.production_method_id} onChange={setF('production_method_id')} required fullWidth>
                {masters.methods.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="เพศ" value={form.gender_id} onChange={setF('gender_id')} required fullWidth>
                {masters.genders.map((g) => <MenuItem key={g.id} value={g.id}>{g.name_th}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="สี" value={form.color_id} onChange={setF('color_id')} required fullWidth>
                {masters.colors.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="ขนาด" value={form.size_id} onChange={setF('size_id')} required fullWidth>
                {masters.sizes.map((s) => <MenuItem key={s.id} value={s.id}>{s.size_value}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="ราคาต้นทุน (บาท)" type="number" value={form.cost_price} onChange={setF('cost_price')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="ราคาขาย (บาท)" type="number" value={form.selling_price} onChange={setF('selling_price')} fullWidth /></Grid>
            {!editItem && (
              <Grid item xs={12}>
                <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                  อัพโหลดรูปสินค้า (เลือกหลายรูปได้)
                  <input type="file" hidden accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files))} />
                </Button>
                {imageFiles.length > 0 && <Typography variant="caption" ml={1}>{imageFiles.length} ไฟล์</Typography>}
              </Grid>
            )}
            <Grid item xs={12}><FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบสินค้านี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
