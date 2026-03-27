import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Paper, Typography, Chip, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell,
  InputAdornment, Alert, Snackbar, Switch, FormControlLabel, Divider, Grid,
  Tabs, Tab, Checkbox
} from '@mui/material';
import { Add, Edit, Search, Store, Delete, AddCircleOutline, Person } from '@mui/icons-material';
import api from '../../utils/api';

const newContact = () => ({ _id: Math.random(), phone: '', phone_backup: '', email: '', line_id: '', facebook: '', contact_name: '', contact_position: '' });
const newCredit = () => ({ _id: Math.random(), brand_id: '', credit_limit: 0, credit_days: 0 });
const newBank = () => ({ _id: Math.random(), bank_name: '', account_number: '', account_name: '' });

const emptyForm = {
  company_name: '', id_card_number: '', is_vat: false, tax_id: '',
  house_number: '', moo: '', soi: '', road: '',
  province_id: '', amphoe: '', tambon: '', zipcode: '', region_id: '',
  username: '', password: '', role: 'customer', status: 'active',
  transport_company_id: '', boxes_per_shipment: 6,
  sales_person_id: '', sales_zone: '', customer_since: '',
  contacts: [newContact()], credits: [], bankAccounts: [],
};

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const [masters, setMasters] = useState({ provinces: [], regions: [], brands: [], transports: [], employees: [] });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchMasters = useCallback(async () => {
    try {
      const [prov, reg, brands, trans, emp] = await Promise.all([
        api.get('/provinces'),
        api.get('/regions'),
        api.get('/brands'),
        api.get('/transport'),
        api.get('/employees', { params: { limit: 999 } }),
      ]);
      setMasters({
        provinces: prov.data.data || [],
        regions: reg.data.data || [],
        brands: brands.data.data || [],
        transports: trans.data.data || [],
        employees: emp.data.data || [],
      });
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { q, page, limit: 25 } });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { showSnack('โหลดข้อมูลล้มเหลว', 'error'); }
    finally { setLoading(false); }
  }, [q, page]);

  useEffect(() => { fetchMasters(); }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm, contacts: [newContact()], credits: [], bankAccounts: [] });
    setTab(0);
    setDialogOpen(true);
  };

  const openEdit = async (item) => {
    setEditItem(item);
    try {
      const res = await api.get(`/customers/${item.id}`);
      const d = res.data.data;
      setForm({
        company_name: d.company_name || '', id_card_number: d.id_card_number || '',
        is_vat: !!d.is_vat, tax_id: d.tax_id || '',
        house_number: d.house_number || '', moo: d.moo || '', soi: d.soi || '', road: d.road || '',
        province_id: d.province_id || '', amphoe: d.amphoe || '', tambon: d.tambon || '',
        zipcode: d.zipcode || '', region_id: d.region_id || '',
        username: d.username || '', password: '',
        role: d.role || 'customer', status: d.status || 'active',
        transport_company_id: d.transport_company_id || '',
        boxes_per_shipment: d.boxes_per_shipment || 6,
        sales_person_id: d.sales_person_id || '',
        sales_zone: d.sales_zone || '',
        customer_since: d.customer_since ? d.customer_since.split('T')[0] : '',
        contacts: d.contacts?.length > 0 ? d.contacts.map(c => ({ ...c, _id: Math.random() })) : [newContact()],
        credits: (d.credits || []).map(c => ({ ...c, _id: Math.random() })),
        bankAccounts: (d.bankAccounts || []).map(b => ({ ...b, _id: Math.random() })),
      });
    } catch { showSnack('โหลดข้อมูลล้มเหลว', 'error'); return; }
    setTab(0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        is_vat: form.is_vat ? 1 : 0,
        contacts: JSON.stringify(form.contacts),
        credits: JSON.stringify(form.credits),
        bankAccounts: JSON.stringify(form.bankAccounts),
      };
      if (editItem) await api.put(`/customers/${editItem.id}`, payload);
      else await api.post('/customers', payload);
      showSnack(editItem ? 'อัพเดตสำเร็จ' : 'เพิ่มสำเร็จ');
      setDialogOpen(false);
      fetchData();
    } catch (e) { showSnack(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const updateContact = (idx, k, v) => setForm(p => ({ ...p, contacts: p.contacts.map((c, i) => i === idx ? { ...c, [k]: v } : c) }));
  const addContact = () => setForm(p => ({ ...p, contacts: [...p.contacts, newContact()] }));
  const removeContact = (idx) => setForm(p => ({ ...p, contacts: p.contacts.filter((_, i) => i !== idx) }));

  const updateCredit = (idx, k, v) => setForm(p => ({ ...p, credits: p.credits.map((c, i) => i === idx ? { ...c, [k]: v } : c) }));
  const addCredit = () => setForm(p => ({ ...p, credits: [...p.credits, newCredit()] }));
  const removeCredit = (idx) => setForm(p => ({ ...p, credits: p.credits.filter((_, i) => i !== idx) }));

  const updateBank = (idx, k, v) => setForm(p => ({ ...p, bankAccounts: p.bankAccounts.map((b, i) => i === idx ? { ...b, [k]: v } : b) }));
  const addBank = () => setForm(p => ({ ...p, bankAccounts: [...p.bankAccounts, newBank()] }));
  const removeBank = (idx) => setForm(p => ({ ...p, bankAccounts: p.bankAccounts.filter((_, i) => i !== idx) }));

  const totalCredit = form.credits.reduce((s, c) => s + (Number(c.credit_limit) || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Store sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h5">ลูกค้าหลัก</Typography>
          <Typography variant="body2" color="text.secondary">จัดการข้อมูลลูกค้าหลัก {total} รายการ</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <TextField placeholder="ค้นหา..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ width: 260 }} />
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่มลูกค้า</Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>รหัสลูกค้า</TableCell>
              <TableCell>ชื่อบริษัท / ร้านค้า</TableCell>
              <TableCell>จังหวัด</TableCell>
              <TableCell>วงเงินเครดิตรวม</TableCell>
              <TableCell>เซลล์</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell width={60} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{r.customer_code}</Typography></TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{r.company_name}</Typography>
                  {r.is_vat ? <Chip label="VAT" size="small" color="info" sx={{ ml: 1, height: 18, fontSize: 10 }} /> : null}
                </TableCell>
                <TableCell>{r.province_name || '-'}</TableCell>
                <TableCell>
                  <Typography fontWeight={600} color="primary.main">
                    {Number(r.total_credit_limit || 0).toLocaleString()} ฿
                  </Typography>
                </TableCell>
                <TableCell>{r.sales_first_name ? `${r.sales_first_name} ${r.sales_last_name}` : '-'}</TableCell>
                <TableCell><Chip label={r.status === 'active' ? 'ใช้งาน' : 'ปิด'} color={r.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>{editItem ? 'แก้ไขลูกค้าหลัก' : 'เพิ่มลูกค้าหลัก'}</DialogTitle>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="ข้อมูลหลัก" />
          <Tab label={`ข้อมูลติดต่อ (${form.contacts.length})`} />
          <Tab label={`เครดิต (${form.credits.length} แบรนด์)`} />
          <Tab label={`บัญชีธนาคาร (${form.bankAccounts.length})`} />
        </Tabs>
        <DialogContent sx={{ minHeight: 400 }}>
          {/* Tab 0: ข้อมูลหลัก */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
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
                <TextField select label="ภูมิภาค" value={form.region_id} onChange={setF('region_id')} fullWidth>
                  <MenuItem value="">-</MenuItem>
                  {masters.regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name_th}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">ข้อมูลเพิ่มเติม</Typography></Divider></Grid>
              <Grid item xs={6} sm={3}>
                <TextField select label="จำนวนลัง" value={form.boxes_per_shipment} onChange={setF('boxes_per_shipment')} fullWidth>
                  <MenuItem value={4}>4 ลัง</MenuItem>
                  <MenuItem value={6}>6 ลัง</MenuItem>
                  <MenuItem value={8}>8 ลัง</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select label="บริษัทขนส่ง" value={form.transport_company_id} onChange={setF('transport_company_id')} fullWidth>
                  <MenuItem value="">-</MenuItem>
                  {masters.transports.map(t => <MenuItem key={t.id} value={t.id}>{t.company_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select label="เซลล์ที่ดูแล" value={form.sales_person_id} onChange={setF('sales_person_id')} fullWidth>
                  <MenuItem value="">-</MenuItem>
                  {masters.employees.map(e => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}><TextField label="เขตการขาย" value={form.sales_zone} onChange={setF('sales_zone')} fullWidth /></Grid>
              <Grid item xs={6} sm={4}><TextField label="วันที่เริ่มเป็นลูกค้า" type="date" value={form.customer_since} onChange={setF('customer_since')} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">บัญชีผู้ใช้</Typography></Divider></Grid>
              <Grid item xs={6} sm={4}><TextField label="Username" value={form.username} onChange={setF('username')} fullWidth /></Grid>
              <Grid item xs={6} sm={4}><TextField label={editItem ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน'} type="password" value={form.password} onChange={setF('password')} fullWidth /></Grid>
              <Grid item xs={6} sm={4}>
                <TextField select label="สถานะ" value={form.status} onChange={setF('status')} fullWidth>
                  <MenuItem value="active">ใช้งาน</MenuItem>
                  <MenuItem value="inactive">ปิด</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 1: ข้อมูลติดต่อ */}
          <TabPanel value={tab} index={1}>
            {form.contacts.map((ct, idx) => (
              <Paper key={ct._id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
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
            ))}
            <Button startIcon={<AddCircleOutline />} onClick={addContact} sx={{ mt: 1 }}>เพิ่มผู้ติดต่อ</Button>
          </TabPanel>

          {/* Tab 2: เครดิต */}
          <TabPanel value={tab} index={2}>
            {totalCredit > 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
                <Typography variant="subtitle2" color="primary">วงเงินเครดิตรวม: <strong>{totalCredit.toLocaleString()} ฿</strong></Typography>
              </Paper>
            )}
            {form.credits.map((cr, idx) => (
              <Paper key={cr._id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary">เครดิต {idx + 1}</Typography>
                  <IconButton size="small" onClick={() => removeCredit(idx)} color="error"><Delete fontSize="small" /></IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField select label="แบรนด์ *" value={cr.brand_id} onChange={e => updateCredit(idx, 'brand_id', e.target.value)} fullWidth>
                      <MenuItem value="">เลือกแบรนด์</MenuItem>
                      {masters.brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={4}><TextField label="วงเงิน (บาท)" type="number" value={cr.credit_limit} onChange={e => updateCredit(idx, 'credit_limit', e.target.value)} fullWidth /></Grid>
                  <Grid item xs={6} sm={4}><TextField label="จำนวนวันเครดิต" type="number" value={cr.credit_days} onChange={e => updateCredit(idx, 'credit_days', e.target.value)} fullWidth /></Grid>
                </Grid>
              </Paper>
            ))}
            <Button startIcon={<AddCircleOutline />} onClick={addCredit} sx={{ mt: 1 }}>เพิ่มเครดิตแบรนด์</Button>
          </TabPanel>

          {/* Tab 3: บัญชีธนาคาร */}
          <TabPanel value={tab} index={3}>
            {form.bankAccounts.map((ba, idx) => (
              <Paper key={ba._id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary">บัญชี {idx + 1} {idx === 0 ? <Chip label="หลัก" size="small" color="primary" sx={{ ml: 1 }} /> : null}</Typography>
                  <IconButton size="small" onClick={() => removeBank(idx)} color="error"><Delete fontSize="small" /></IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}><TextField label="ธนาคาร" value={ba.bank_name} onChange={e => updateBank(idx, 'bank_name', e.target.value)} fullWidth /></Grid>
                  <Grid item xs={6} sm={4}><TextField label="เลขบัญชี" value={ba.account_number} onChange={e => updateBank(idx, 'account_number', e.target.value)} fullWidth /></Grid>
                  <Grid item xs={6} sm={4}><TextField label="ชื่อบัญชี" value={ba.account_name} onChange={e => updateBank(idx, 'account_name', e.target.value)} fullWidth /></Grid>
                </Grid>
              </Paper>
            ))}
            <Button startIcon={<AddCircleOutline />} onClick={addBank} sx={{ mt: 1 }}>เพิ่มบัญชีธนาคาร</Button>
          </TabPanel>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.company_name}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(p => ({ ...p, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
