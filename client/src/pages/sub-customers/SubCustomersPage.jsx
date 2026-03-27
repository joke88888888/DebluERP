import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Paper, Typography, Chip, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment, Alert, Snackbar, Divider, Grid, Checkbox, FormControlLabel
} from '@mui/material';
import { Add, Edit, Search, People, Delete, AddCircleOutline } from '@mui/icons-material';
import api from '../../utils/api';

const newContact = () => ({ _id: Math.random(), phone: '', phone_backup: '', email: '', line_id: '', facebook: '', contact_name: '', contact_position: '' });

const emptyForm = {
  parent_customer_id: '', company_name: '', id_card_number: '', is_vat: false, tax_id: '',
  house_number: '', moo: '', soi: '', road: '',
  province_id: '', amphoe: '', tambon: '', zipcode: '',
  status: 'active', boxes_per_shipment: 6,
  sales_person_id: '', sales_zone: '', customer_since: '',
  shared_credit_customer_id: '',
  contacts: [newContact()],
};

export default function SubCustomersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [masters, setMasters] = useState({ provinces: [], customers: [], employees: [] });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchMasters = useCallback(async () => {
    try {
      const [prov, cust, emp] = await Promise.all([
        api.get('/provinces'),
        api.get('/customers', { params: { limit: 999 } }),
        api.get('/employees', { params: { limit: 999 } }),
      ]);
      setMasters({ provinces: prov.data.data || [], customers: cust.data.data || [], employees: emp.data.data || [] });
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/sub-customers', { params: { q, limit: 25 } });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { showSnack('โหลดข้อมูลล้มเหลว', 'error'); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => { fetchMasters(); }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm, contacts: [newContact()] }); setDialogOpen(true); };

  const openEdit = async (item) => {
    setEditItem(item);
    try {
      const res = await api.get(`/sub-customers/${item.id}`);
      const d = res.data.data;
      setForm({
        parent_customer_id: d.parent_customer_id || '',
        company_name: d.company_name || '', id_card_number: d.id_card_number || '',
        is_vat: !!d.is_vat, tax_id: d.tax_id || '',
        house_number: d.house_number || '', moo: d.moo || '', soi: d.soi || '', road: d.road || '',
        province_id: d.province_id || '', amphoe: d.amphoe || '', tambon: d.tambon || '', zipcode: d.zipcode || '',
        status: d.status || 'active', boxes_per_shipment: d.boxes_per_shipment || 6,
        sales_person_id: d.sales_person_id || '', sales_zone: d.sales_zone || '',
        customer_since: d.customer_since ? d.customer_since.split('T')[0] : '',
        shared_credit_customer_id: d.shared_credit_customer_id || '',
        contacts: d.contacts?.length > 0 ? d.contacts.map(c => ({ ...c, _id: Math.random() })) : [newContact()],
      });
    } catch { showSnack('โหลดข้อมูลล้มเหลว', 'error'); return; }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, is_vat: form.is_vat ? 1 : 0, contacts: JSON.stringify(form.contacts) };
      if (editItem) await api.put(`/sub-customers/${editItem.id}`, payload);
      else await api.post('/sub-customers', payload);
      showSnack(editItem ? 'อัพเดตสำเร็จ' : 'เพิ่มสำเร็จ');
      setDialogOpen(false); fetchData();
    } catch (e) { showSnack(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const updateContact = (idx, k, v) => setForm(p => ({ ...p, contacts: p.contacts.map((c, i) => i === idx ? { ...c, [k]: v } : c) }));
  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, newContact()] }));
  const removeContact = (idx) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, i) => i !== idx) }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <People sx={{ color: 'secondary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5">ลูกค้าย่อย</Typography>
          <Typography variant="body2" color="text.secondary">จัดการข้อมูลลูกค้าย่อย {total} รายการ</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <TextField placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ width: 260 }} />
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่มลูกค้าย่อย</Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>รหัส</TableCell>
              <TableCell>ชื่อร้านค้า</TableCell>
              <TableCell>ลูกค้าหลัก</TableCell>
              <TableCell>จังหวัด</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell width={60} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{r.sub_customer_code}</Typography></TableCell>
                <TableCell><Typography fontWeight={600}>{r.company_name}</Typography></TableCell>
                <TableCell>{r.parent_company_name || '-'}</TableCell>
                <TableCell>{r.province_name || '-'}</TableCell>
                <TableCell><Chip label={r.status === 'active' ? 'ใช้งาน' : 'ปิด'} color={r.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขลูกค้าย่อย' : 'เพิ่มลูกค้าย่อย'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField select label="ลูกค้าหลัก *" value={form.parent_customer_id} onChange={setF('parent_customer_id')} fullWidth>
                <MenuItem value="">เลือกลูกค้าหลัก</MenuItem>
                {masters.customers.map(c => <MenuItem key={c.id} value={c.id}>{c.company_name} ({c.customer_code})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="ชื่อบริษัท / ชื่อร้านค้า *" value={form.company_name} onChange={setF('company_name')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="เลขบัตรประชาชน" value={form.id_card_number} onChange={setF('id_card_number')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel control={<Checkbox checked={form.is_vat} onChange={e => setForm(p => ({ ...p, is_vat: e.target.checked }))} />} label="มี VAT" />
                {form.is_vat && <TextField label="เลขผู้เสียภาษี" value={form.tax_id} onChange={setF('tax_id')} size="small" sx={{ flex: 1 }} />}
              </Box>
            </Grid>
            <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">ที่อยู่</Typography></Divider></Grid>
            <Grid item xs={6} sm={3}><TextField label="บ้านเลขที่" value={form.house_number} onChange={setF('house_number')} fullWidth /></Grid>
            <Grid item xs={6} sm={3}><TextField label="หมู่" value={form.moo} onChange={setF('moo')} fullWidth /></Grid>
            <Grid item xs={6} sm={3}><TextField label="ซอย" value={form.soi} onChange={setF('soi')} fullWidth /></Grid>
            <Grid item xs={6} sm={3}><TextField label="ถนน" value={form.road} onChange={setF('road')} fullWidth /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="จังหวัด" value={form.province_id} onChange={setF('province_id')} fullWidth>
                <MenuItem value="">-</MenuItem>
                {masters.provinces.map(p => <MenuItem key={p.id} value={p.id}>{p.name_th}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}><TextField label="อำเภอ" value={form.amphoe} onChange={setF('amphoe')} fullWidth /></Grid>
            <Grid item xs={6} sm={4}><TextField label="ตำบล" value={form.tambon} onChange={setF('tambon')} fullWidth /></Grid>
            <Grid item xs={6} sm={3}><TextField label="รหัสไปรษณีย์" value={form.zipcode} onChange={setF('zipcode')} fullWidth /></Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="จำนวนลัง" value={form.boxes_per_shipment} onChange={setF('boxes_per_shipment')} fullWidth>
                <MenuItem value={4}>4 ลัง</MenuItem>
                <MenuItem value={6}>6 ลัง</MenuItem>
                <MenuItem value={8}>8 ลัง</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="เครดิตร่วมกับร้าน" value={form.shared_credit_customer_id} onChange={setF('shared_credit_customer_id')} fullWidth>
                <MenuItem value="">-</MenuItem>
                {masters.customers.map(c => <MenuItem key={c.id} value={c.id}>{c.company_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select label="สถานะ" value={form.status} onChange={setF('status')} fullWidth>
                <MenuItem value="active">ใช้งาน</MenuItem>
                <MenuItem value="inactive">ปิด</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">ข้อมูลติดต่อ</Typography></Divider></Grid>
            {form.contacts.map((ct, idx) => (
              <Grid item xs={12} key={ct._id}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="primary">ผู้ติดต่อ {idx + 1}</Typography>
                    {form.contacts.length > 1 && <IconButton size="small" onClick={() => removeContact(idx)} color="error"><Delete fontSize="small" /></IconButton>}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}><TextField label="เบอร์โทร" value={ct.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="เบอร์สำรอง" value={ct.phone_backup} onChange={e => updateContact(idx, 'phone_backup', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="Email" value={ct.email} onChange={e => updateContact(idx, 'email', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="Line ID" value={ct.line_id} onChange={e => updateContact(idx, 'line_id', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="Facebook" value={ct.facebook} onChange={e => updateContact(idx, 'facebook', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="ชื่อผู้ติดต่อ" value={ct.contact_name} onChange={e => updateContact(idx, 'contact_name', e.target.value)} fullWidth /></Grid>
                    <Grid item xs={12}><TextField label="ตำแหน่ง" value={ct.contact_position} onChange={e => updateContact(idx, 'contact_position', e.target.value)} fullWidth /></Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
            <Grid item xs={12}><Button startIcon={<AddCircleOutline />} onClick={addContact}>เพิ่มผู้ติดต่อ</Button></Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.company_name || !form.parent_customer_id}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
