import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Grid, Table, TableHead,
  TableRow, TableCell, TableBody, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CloudUpload, AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { productsApi, brandsApi, modelsApi, versionsApi, categoriesApi, productionMethodsApi, gendersApi, colorsApi, sizesApi } from '../../services';

const emptyHeader = { brand_id: '', model_id: '', version_id: '', product_category_id: '', production_method_id: '', cost_price: 0, selling_price: 0 };
const emptyEditForm = { brand_id: '', model_id: '', version_id: '', product_category_id: '', production_method_id: '', gender_id: '', color_id: '', size_id: '', cost_price: 0, selling_price: 0, is_active: true };
const newVariant = () => ({ _id: Math.random(), color_id: '', size_id: '', gender_id: '', product_name: '' });

const computeSKU = (header, variant, masters) => {
  const { brand_id, model_id, version_id, product_category_id, production_method_id } = header;
  const { color_id, size_id, gender_id } = variant;
  if (!brand_id || !model_id || !version_id || !product_category_id || !production_method_id || !color_id || !size_id || !gender_id) return '';
  const brand = masters.brands.find(b => b.id == brand_id);
  const pm = masters.methods.find(m => m.id == production_method_id);
  const gender = masters.genders.find(g => g.id == gender_id);
  const model = masters.models.find(m => m.id == model_id);
  const version = masters.versions.find(v => v.id == version_id);
  const cat = masters.categories.find(c => c.id == product_category_id);
  const color = masters.colors.find(c => c.id == color_id);
  const size = masters.sizes.find(s => s.id == size_id);
  if (!brand || !pm || !gender || !model || !version || !cat || !color || !size) return '';
  return `${brand.code}${pm.code}${gender.code}${model.code}${version.code}${cat.code}${color.code}#${size.code}`;
};

const computeName = (header, variant, masters) => {
  const brand = masters.brands.find(b => b.id == header.brand_id);
  const model = masters.models.find(m => m.id == header.model_id);
  const color = masters.colors.find(c => c.id == variant.color_id);
  const size = masters.sizes.find(s => s.id == variant.size_id);
  if (!brand || !model || !color || !size) return '';
  return `${brand.name} ${model.name} ${color.name} Size ${size.size_value}`;
};

export default function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [existingSkus, setExistingSkus] = useState(new Set());
  const [masters, setMasters] = useState({ brands: [], models: [], versions: [], categories: [], methods: [], genders: [], colors: [], sizes: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [header, setHeader] = useState(emptyHeader);
  const [variants, setVariants] = useState([newVariant()]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ limit: 9999 });
      const data = res.data.data || [];
      setRows(data);
      setExistingSkus(new Set(data.map(r => r.sku)));
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally { setLoading(false); }
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
      setMasters(prev => ({ ...prev, brands: b.data.data || [], versions: v.data.data || [], categories: c.data.data || [], methods: pm.data.data || [], genders: g.data.data || [], colors: co.data.data || [], sizes: s.data.data || [] }));
    });
    fetchData();
  }, []);

  const loadModels = async (brand_id) => {
    if (!brand_id) { setMasters(m => ({ ...m, models: [] })); return; }
    const res = await modelsApi.getAll({ brand_id, is_active: 'true' });
    setMasters(m => ({ ...m, models: res.data.data || [] }));
  };

  const openCreate = () => {
    setEditItem(null);
    setHeader(emptyHeader);
    setVariants([newVariant()]);
    setMasters(m => ({ ...m, models: [] }));
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      brand_id: item.brand_id, model_id: item.model_id, version_id: item.version_id,
      product_category_id: item.product_category_id, production_method_id: item.production_method_id,
      gender_id: item.gender_id, color_id: item.color_id, size_id: item.size_id,
      cost_price: item.cost_price, selling_price: item.selling_price, is_active: Boolean(item.is_active)
    });
    loadModels(item.brand_id);
    setDialogOpen(true);
  };

  const setV = (idx, key) => (e) => {
    setVariants(prev => {
      const next = [...prev];
      const updated = { ...next[idx], [key]: e.target.value };
      if ((key === 'color_id' || key === 'size_id') && !updated.product_name) {
        updated.product_name = computeName(header, updated, masters);
      }
      next[idx] = updated;
      return next;
    });
  };

  const addVariant = () => setVariants(p => [...p, newVariant()]);
  const removeVariant = (idx) => setVariants(p => p.filter((_, i) => i !== idx));

  const getSkuStatus = (sku) => {
    if (!sku) return null;
    if (existingSkus.has(sku)) return 'duplicate';
    const count = variants.filter(v => computeSKU(header, v, masters) === sku).length;
    if (count > 1) return 'duplicate';
    return 'ok';
  };

  const handleSaveBulk = async () => {
    const filled = variants.filter(v => v.color_id && v.size_id && v.gender_id);
    if (filled.length === 0) return showSnack('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ', 'error');
    if (!header.brand_id || !header.model_id || !header.version_id || !header.product_category_id || !header.production_method_id)
      return showSnack('กรุณาเลือก แบรนด์ รุ่น เวอร์ชัน ประเภท และวิธีการผลิต', 'error');

    setSaving(true);
    try {
      const res = await productsApi.createBulk({
        brand_id: header.brand_id, model_id: header.model_id, version_id: header.version_id,
        product_category_id: header.product_category_id, production_method_id: header.production_method_id,
        cost_price: header.cost_price, selling_price: header.selling_price,
        variants: filled.map(v => ({ color_id: v.color_id, size_id: v.size_id, gender_id: v.gender_id, product_name: v.product_name || undefined }))
      });
      const { created, duplicates } = res.data.data;
      showSnack(`สร้างสำเร็จ ${created} รายการ${duplicates > 0 ? `, ซ้ำ ${duplicates} รายการ` : ''}`, duplicates > 0 && created === 0 ? 'warning' : 'success');
      if (created > 0) { setDialogOpen(false); fetchData(); }
    } catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await productsApi.update(editItem.id, editForm);
      showSnack('อัพเดตสำเร็จ');
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
        ? <img src={`/uploads/${p.value}`} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
        : <Box sx={{ width: 48, height: 48, bgcolor: 'grey.200', borderRadius: 1 }} />
    },
    { field: 'sku', headerName: 'SKU', width: 200 },
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

  const setH = (k) => (e) => {
    const val = e.target.value;
    setHeader(p => ({ ...p, [k]: val }));
    if (k === 'brand_id') { setHeader(p => ({ ...p, brand_id: val, model_id: '' })); loadModels(val); }
    setVariants(prev => prev.map(v => ({ ...v, product_name: '' })));
  };

  const setEF = (k) => (e) => setEditForm(p => ({ ...p, [k]: e.target.value }));

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

      {/* CREATE DIALOG — BULK */}
      <Dialog open={dialogOpen && !editItem} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>เพิ่มสินค้า</DialogTitle>
        <DialogContent>
          {/* HEADER */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 1 }}>ข้อมูลหลัก (ใช้ร่วมกันทุก SKU)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField select label="แบรนด์ *" value={header.brand_id} onChange={setH('brand_id')} fullWidth size="small">
                {masters.brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="รุ่น *" value={header.model_id} onChange={setH('model_id')} fullWidth size="small" disabled={!header.brand_id}>
                {masters.models.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="เวอร์ชัน *" value={header.version_id} onChange={setH('version_id')} fullWidth size="small">
                {masters.versions.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="ประเภทสินค้า *" value={header.product_category_id} onChange={setH('product_category_id')} fullWidth size="small">
                {masters.categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="วิธีการผลิต *" value={header.production_method_id} onChange={setH('production_method_id')} fullWidth size="small">
                {masters.methods.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField label="ราคาต้นทุน" type="number" value={header.cost_price} onChange={setH('cost_price')} fullWidth size="small" />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField label="ราคาขาย" type="number" value={header.selling_price} onChange={setH('selling_price')} fullWidth size="small" />
            </Grid>
          </Grid>

          {/* VARIANTS TABLE */}
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">รายการ SKU (สี / ขนาด / เพศ)</Typography>
            <Button size="small" startIcon={<AddCircleOutline />} onClick={addVariant}>เพิ่มแถว</Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width={40}>#</TableCell>
                  <TableCell width={160}>สี *</TableCell>
                  <TableCell width={140}>ขนาด *</TableCell>
                  <TableCell width={120}>เพศ *</TableCell>
                  <TableCell>ชื่อสินค้า</TableCell>
                  <TableCell width={220}>SKU Preview</TableCell>
                  <TableCell width={80}>สถานะ</TableCell>
                  <TableCell width={40}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((v, idx) => {
                  const sku = computeSKU(header, v, masters);
                  const status = getSkuStatus(sku);
                  return (
                    <TableRow key={v._id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <TextField select value={v.color_id} onChange={setV(idx, 'color_id')} size="small" fullWidth>
                          {masters.colors.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField select value={v.size_id} onChange={setV(idx, 'size_id')} size="small" fullWidth>
                          {masters.sizes.map(s => <MenuItem key={s.id} value={s.id}>{s.size_value}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField select value={v.gender_id} onChange={setV(idx, 'gender_id')} size="small" fullWidth>
                          {masters.genders.map(g => <MenuItem key={g.id} value={g.id}>{g.name_th}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField value={v.product_name} onChange={setV(idx, 'product_name')} size="small" fullWidth placeholder="(auto)" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" color={status === 'duplicate' ? 'error.main' : 'text.primary'}>
                          {sku || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {status === 'ok' && <Chip label="ใหม่" color="success" size="small" />}
                        {status === 'duplicate' && <Chip label="ซ้ำ!" color="error" size="small" />}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeVariant(idx)} disabled={variants.length === 1}>
                          <RemoveCircleOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          {variants.some(v => getSkuStatus(computeSKU(header, v, masters)) === 'duplicate') && (
            <Alert severity="warning" sx={{ mt: 1 }}>บาง SKU ซ้ำกับที่มีอยู่แล้ว จะถูกข้ามและไม่สร้างซ้ำ</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveBulk} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : `บันทึก ${variants.filter(v => v.color_id && v.size_id && v.gender_id).length} รายการ`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={dialogOpen && Boolean(editItem)} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>แก้ไขสินค้า</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="แบรนด์" value={editForm.brand_id} onChange={(e) => { setEF('brand_id')(e); setEditForm(p => ({ ...p, model_id: '' })); loadModels(e.target.value); }} fullWidth>
                {masters.brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="รุ่น" value={editForm.model_id} onChange={setEF('model_id')} fullWidth>
                {masters.models.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="เวอร์ชัน" value={editForm.version_id} onChange={setEF('version_id')} fullWidth>
                {masters.versions.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="ประเภทสินค้า" value={editForm.product_category_id} onChange={setEF('product_category_id')} fullWidth>
                {masters.categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="วิธีการผลิต" value={editForm.production_method_id} onChange={setEF('production_method_id')} fullWidth>
                {masters.methods.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="เพศ" value={editForm.gender_id} onChange={setEF('gender_id')} fullWidth>
                {masters.genders.map(g => <MenuItem key={g.id} value={g.id}>{g.name_th}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="สี" value={editForm.color_id} onChange={setEF('color_id')} fullWidth>
                {masters.colors.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="ขนาด" value={editForm.size_id} onChange={setEF('size_id')} fullWidth>
                {masters.sizes.map(s => <MenuItem key={s.id} value={s.id}>{s.size_value}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="ราคาต้นทุน (บาท)" type="number" value={editForm.cost_price} onChange={setEF('cost_price')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="ราคาขาย (บาท)" type="number" value={editForm.selling_price} onChange={setEF('selling_price')} fullWidth /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={editForm.is_active} onChange={(e) => setEditForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบสินค้านี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
