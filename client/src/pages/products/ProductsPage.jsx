import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Grid, Table, TableHead,
  TableRow, TableCell, TableBody, Alert, Card, CardContent,
  Divider, Stack
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add, Edit, Delete, Search, AddCircleOutline, RemoveCircleOutline,
  Inventory2, AddPhotoAlternate, Close
} from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { productsApi, brandsApi, modelsApi, versionsApi, categoriesApi, productionMethodsApi, gendersApi, colorsApi, sizesApi } from '../../services';

const emptyHeader = { brand_id: '', model_id: '', version_id: '', product_category_id: '', production_method_id: '' };
const emptyEditForm = { brand_id: '', model_id: '', version_id: '', product_category_id: '', production_method_id: '', gender_id: '', color_id: '', size_id: '', cost_price: 0, selling_price: 0, is_active: true };
const newGroup = () => ({ _id: Math.random(), color_id: '', gender_id: '', imageFile: null, imagePreview: '' });
const newSizeEntry = () => ({ _id: Math.random(), size_id: '', cost_price: 0, selling_price: 0 });

const computeName = (header, colorId, genderId, sizeId, masters) => {
  const sku = computeSKU(header, colorId, genderId, sizeId, masters);
  if (!sku) return '';
  const color = masters.colors.find(c => c.id == colorId);
  const size = masters.sizes.find(s => s.id == sizeId);
  if (!color || !size) return '';
  return `${sku.slice(0, 8)} ${color.name} ${size.size_value}`;
};

const computeSKU = (header, colorId, genderId, sizeId, masters) => {
  const { brand_id, model_id, version_id, product_category_id, production_method_id } = header;
  if (!brand_id || !model_id || !version_id || !product_category_id || !production_method_id || !colorId || !sizeId || !genderId) return '';
  const brand = masters.brands.find(b => b.id == brand_id);
  const pm = masters.methods.find(m => m.id == production_method_id);
  const gender = masters.genders.find(g => g.id == genderId);
  const model = masters.models.find(m => m.id == model_id);
  const version = masters.versions.find(v => v.id == version_id);
  const cat = masters.categories.find(c => c.id == product_category_id);
  const color = masters.colors.find(c => c.id == colorId);
  const size = masters.sizes.find(s => s.id == sizeId);
  if (!brand || !pm || !gender || !model || !version || !cat || !color || !size) return '';
  return `${brand.code}${pm.code}${gender.code}${model.code}${version.code}${cat.code}${color.code}#${size.code}`;
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
  // groups: [{ _id, color_id, gender_id, imageFile, imagePreview, sizes: [{ _id, size_id }] }]
  const [groups, setGroups] = useState([{ ...newGroup(), sizes: [newSizeEntry()] }]);
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
    setGroups([{ ...newGroup(), sizes: [newSizeEntry()] }]);
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

  // Group management helpers
  const addGroup = () => setGroups(p => [...p, { ...newGroup(), sizes: [newSizeEntry()] }]);
  const removeGroup = (gIdx) => setGroups(p => p.filter((_, i) => i !== gIdx));
  const updateGroup = (gIdx, key, val) => setGroups(p => { const n = [...p]; n[gIdx] = { ...n[gIdx], [key]: val }; return n; });
  const addSizeToGroup = (gIdx) => setGroups(p => { const n = [...p]; n[gIdx] = { ...n[gIdx], sizes: [...n[gIdx].sizes, newSizeEntry()] }; return n; });
  const removeSizeFromGroup = (gIdx, sIdx) => setGroups(p => { const n = [...p]; n[gIdx] = { ...n[gIdx], sizes: n[gIdx].sizes.filter((_, i) => i !== sIdx) }; return n; });
  const updateSizeInGroup = (gIdx, sIdx, key, value) => setGroups(p => { const n = [...p]; const sg = [...n[gIdx].sizes]; sg[sIdx] = { ...sg[sIdx], [key]: value }; n[gIdx] = { ...n[gIdx], sizes: sg }; return n; });

  const getSkuStatus = (sku) => {
    if (!sku) return null;
    if (existingSkus.has(sku)) return 'duplicate';
    // Check within current groups
    let count = 0;
    for (const g of groups) {
      for (const s of g.sizes) {
        if (computeSKU(header, g.color_id, g.gender_id, s.size_id, masters) === sku) count++;
      }
    }
    if (count > 1) return 'duplicate';
    return 'ok';
  };

  const hasDuplicates = () => {
    for (const g of groups) {
      for (const s of g.sizes) {
        if (!s.size_id) continue;
        const sku = computeSKU(header, g.color_id, g.gender_id, s.size_id, masters);
        if (getSkuStatus(sku) === 'duplicate') return true;
      }
    }
    return false;
  };

  const handleSaveBulk = async () => {
    const allVariants = [];
    for (const g of groups) {
      if (!g.color_id || !g.gender_id) continue;
      for (const s of g.sizes) {
        if (!s.size_id) continue;
        allVariants.push({ color_id: g.color_id, gender_id: g.gender_id, size_id: s.size_id, cost_price: s.cost_price || 0, selling_price: s.selling_price || 0 });
      }
    }
    if (allVariants.length === 0) return showSnack('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ', 'error');
    if (!header.brand_id || !header.model_id || !header.version_id || !header.product_category_id || !header.production_method_id)
      return showSnack('กรุณาเลือก แบรนด์ รุ่น เวอร์ชัน ประเภท และวิธีการผลิต', 'error');
    if (hasDuplicates()) return showSnack('มี SKU ที่ซ้ำกันในระบบ กรุณาแก้ไขก่อนบันทึก', 'error');

    setSaving(true);
    try {
      const res = await productsApi.createBulk({
        brand_id: header.brand_id, model_id: header.model_id, version_id: header.version_id,
        product_category_id: header.product_category_id, production_method_id: header.production_method_id,
        variants: allVariants
      });
      const { created, duplicates, results } = res.data.data;

      // Upload images for groups that have images
      for (const g of groups) {
        if (!g.imageFile) continue;
        const createdForGroup = (results || []).filter(r => r.status === 'created' && r.color_id == g.color_id && r.gender_id == g.gender_id);
        for (const r of createdForGroup) {
          try {
            const fd = new FormData();
            fd.append('files', g.imageFile);
            await productsApi.uploadImages(r.id, fd);
          } catch (e) { /* silently continue */ }
        }
      }

      showSnack(`สร้างสำเร็จ ${created} รายการ${duplicates > 0 ? `, ซ้ำ ${duplicates} รายการ` : ''}`, created === 0 ? 'warning' : 'success');
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
        ? <img src={`/uploads/${p.value}`} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
        : <Box sx={{ width: 48, height: 48, bgcolor: 'grey.100', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inventory2 sx={{ color: 'grey.400', fontSize: 20 }} />
          </Box>
    },
    { field: 'sku', headerName: 'SKU', width: 210, renderCell: p => <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{p.value}</Typography> },
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

  const filtered = rows.filter(r =>
    r.sku?.toLowerCase().includes(search.toLowerCase()) || r.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const setH = (k) => (e) => {
    const val = e.target.value;
    if (k === 'brand_id') { setHeader(p => ({ ...p, brand_id: val, model_id: '' })); loadModels(val); }
    else setHeader(p => ({ ...p, [k]: val }));
  };

  const setEF = (k) => (e) => setEditForm(p => ({ ...p, [k]: e.target.value }));

  const totalVariants = groups.reduce((acc, g) => acc + g.sizes.filter(s => s.size_id && g.color_id && g.gender_id).length, 0);
  const anyDup = hasDuplicates();

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', display: 'flex' }}>
            <Inventory2 sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>รายการสินค้า (Products)</Typography>
            <Typography variant="body2" color="text.secondary">จัดการข้อมูลสินค้าและ SKU</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>เพิ่มสินค้า</Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <TextField placeholder="ค้นหา SKU หรือชื่อสินค้า..." value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ width: 360 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        </Box>
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight rowHeight={64}
          pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      {/* CREATE DIALOG — BULK */}
      <Dialog open={dialogOpen && !editItem} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>เพิ่มสินค้า</Typography>
          <Typography variant="body2" color="text.secondary">เลือกสี + เพศ + รูป แล้วเพิ่มขนาดในแต่ละกลุ่ม</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {/* HEADER */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>ข้อมูลหลัก</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
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
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* VARIANT GROUPS */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>กลุ่มสินค้า (สี + เพศ + รูป)</Typography>
            <Button size="small" variant="outlined" startIcon={<AddCircleOutline />} onClick={addGroup} sx={{ borderRadius: 2 }}>
              เพิ่มกลุ่ม
            </Button>
          </Box>

          <Stack spacing={2}>
            {groups.map((g, gIdx) => {
              return (
                <Card key={g._id} variant="outlined" sx={{ borderRadius: 2, position: 'relative' }}>
                  <CardContent sx={{ pb: 1 }}>
                    {/* Group header: color + gender + image */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>กลุ่มที่ {gIdx + 1}</Typography>
                      </Box>
                      <TextField select label="สี *" value={g.color_id}
                        onChange={e => updateGroup(gIdx, 'color_id', e.target.value)}
                        size="small" sx={{ minWidth: 160 }}>
                        {masters.colors.map(c => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {c.hex_code && <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex_code, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />}
                              {c.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField select label="เพศ *" value={g.gender_id}
                        onChange={e => updateGroup(gIdx, 'gender_id', e.target.value)}
                        size="small" sx={{ minWidth: 130 }}>
                        {masters.genders.map(gn => <MenuItem key={gn.id} value={gn.id}>{gn.name_th}</MenuItem>)}
                      </TextField>

                      {/* Image upload */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {g.imagePreview ? (
                          <Box sx={{ position: 'relative' }}>
                            <img src={g.imagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} />
                            <IconButton size="small" onClick={() => setGroups(p => { const n = [...p]; n[gIdx] = { ...n[gIdx], imageFile: null, imagePreview: '' }; return n; })}
                              sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', boxShadow: 1, p: 0.25 }}>
                              <Close sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternate />} sx={{ borderRadius: 2, height: 36 }}>
                            รูปภาพ
                            <input type="file" hidden accept="image/*" onChange={e => {
                              const f = e.target.files[0];
                              if (f) {
                                const url = URL.createObjectURL(f);
                                setGroups(p => { const n = [...p]; n[gIdx] = { ...n[gIdx], imageFile: f, imagePreview: url }; return n; });
                              }
                            }} />
                          </Button>
                        )}
                      </Box>

                      <Box sx={{ flex: 1 }} />
                      <IconButton size="small" color="error" onClick={() => removeGroup(gIdx)} disabled={groups.length === 1}>
                        <RemoveCircleOutline fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Size rows */}
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', minWidth: 110 }}>ขนาด *</TableCell>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', minWidth: 110 }}>ราคาต้นทุน</TableCell>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', minWidth: 110 }}>ราคาขาย</TableCell>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', minWidth: 200 }}>ชื่อสินค้า (auto)</TableCell>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', minWidth: 160 }}>SKU Preview</TableCell>
                            <TableCell sx={{ fontSize: 12, color: 'text.secondary', width: 72 }}>สถานะ</TableCell>
                            <TableCell width={40} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {g.sizes.map((s, sIdx) => {
                            const sku = computeSKU(header, g.color_id, g.gender_id, s.size_id, masters);
                            const status = getSkuStatus(sku);
                            const autoName = computeName(header, g.color_id, g.gender_id, s.size_id, masters);
                            return (
                              <TableRow key={s._id}>
                                <TableCell>
                                  <TextField select value={s.size_id} onChange={e => updateSizeInGroup(gIdx, sIdx, 'size_id', e.target.value)} size="small" fullWidth>
                                    {masters.sizes.map(sz => <MenuItem key={sz.id} value={sz.id}>{sz.size_value}</MenuItem>)}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <TextField type="number" value={s.cost_price} onChange={e => updateSizeInGroup(gIdx, sIdx, 'cost_price', e.target.value)} size="small" fullWidth inputProps={{ min: 0 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField type="number" value={s.selling_price} onChange={e => updateSizeInGroup(gIdx, sIdx, 'selling_price', e.target.value)} size="small" fullWidth inputProps={{ min: 0 }} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color={autoName ? 'text.primary' : 'text.disabled'} sx={{ fontStyle: autoName ? 'normal' : 'italic' }}>
                                    {autoName || '(กรอกข้อมูลให้ครบ)'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" fontFamily="monospace" color={status === 'duplicate' ? 'error.main' : 'text.primary'} fontWeight={sku ? 600 : 400}>
                                    {sku || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {status === 'ok' && <Chip label="ใหม่" color="success" size="small" />}
                                  {status === 'duplicate' && <Chip label="ซ้ำ!" color="error" size="small" />}
                                </TableCell>
                                <TableCell>
                                  <IconButton size="small" color="error" onClick={() => removeSizeFromGroup(gIdx, sIdx)} disabled={g.sizes.length === 1}>
                                    <RemoveCircleOutline fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <Button size="small" startIcon={<AddCircleOutline />} onClick={() => addSizeToGroup(gIdx)} sx={{ mt: 1, ml: 0.5 }}>
                        เพิ่มขนาด
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {anyDup && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              มี SKU ที่ซ้ำกันในระบบ กรุณาแก้ไขก่อนบันทึก — ระบบจะไม่อนุญาตให้บันทึก SKU ซ้ำ
            </Alert>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveBulk} disabled={saving || anyDup} sx={{ minWidth: 140 }}>
            {saving ? <CircularProgress size={20} /> : `บันทึก ${totalVariants} รายการ`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={dialogOpen && Boolean(editItem)} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>แก้ไขสินค้า</Typography>
          {editItem && <Typography variant="caption" fontFamily="monospace" color="text.secondary">{editItem.sku}</Typography>}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="แบรนด์" value={editForm.brand_id} onChange={e => { setEF('brand_id')(e); setEditForm(p => ({ ...p, model_id: '' })); loadModels(e.target.value); }} fullWidth>
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
                {masters.genders.map(gn => <MenuItem key={gn.id} value={gn.id}>{gn.name_th}</MenuItem>)}
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
            <Grid item xs={12}><FormControlLabel control={<Switch checked={editForm.is_active} onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))} />} label="ใช้งาน" /></Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving} sx={{ minWidth: 100 }}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบสินค้านี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
