import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, MenuItem, Grid, Avatar, Tab, Tabs, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CloudUpload, Upload } from '@mui/icons-material';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppSnackbar from '../../components/common/Snackbar';
import useSnackbar from '../../hooks/useSnackbar';
import { employeesApi } from '../../services';

const emptyForm = {
  prefix: '', first_name: '', last_name: '', id_card_number: '', phone: '', email: '',
  address: '', position_id: '', employment_type_id: '', base_salary: 0,
  has_ot: false, ot_rate_multiplier: 1.5, hire_date: '', status: 'active'
};

const emptyUserForm = { create_user: false, username: '', password: '', confirm_password: '', user_role: 'user' };

export default function EmployeesPage() {
  const [rows, setRows] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [tabVal, setTabVal] = useState(0);
  const { snack, showSnack, closeSnack } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getAll({ q: search || undefined });
      setRows(res.data.data || []);
    } catch (err) {
      showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    employeesApi.getPositions().then((r) => setPositions(r.data.data || []));
    employeesApi.getEmploymentTypes().then((r) => setEmploymentTypes(r.data.data || []));
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setProfileFile(null); setProfilePreview('');
    setUserForm(emptyUserForm); setTabVal(0); setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      prefix: item.prefix || '', first_name: item.first_name, last_name: item.last_name,
      id_card_number: item.id_card_number || '', phone: item.phone || '', email: item.email || '',
      address: item.address || '', position_id: item.position_id || '', employment_type_id: item.employment_type_id || '',
      base_salary: item.base_salary, has_ot: Boolean(item.has_ot), ot_rate_multiplier: item.ot_rate_multiplier,
      hire_date: item.hire_date ? item.hire_date.split('T')[0] : '', status: item.status
    });
    setProfileFile(null); setProfilePreview(item.profile_image ? `/uploads/${item.profile_image}` : '');
    setUserForm(emptyUserForm); setTabVal(0); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editItem && userForm.create_user) {
      if (!userForm.username) return showSnack('กรุณากรอก Username', 'error');
      if (!userForm.password) return showSnack('กรุณากรอก Password', 'error');
      if (userForm.password !== userForm.confirm_password) return showSnack('Password ไม่ตรงกัน', 'error');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (profileFile) fd.append('file', profileFile);
      if (editItem) {
        await employeesApi.update(editItem.id, fd);
        showSnack('อัพเดตสำเร็จ');
      } else {
        if (userForm.create_user) {
          fd.append('create_user', 'true');
          fd.append('username', userForm.username);
          fd.append('password', userForm.password);
          fd.append('user_role', userForm.user_role);
        }
        await employeesApi.create(fd);
        showSnack('เพิ่มข้อมูลสำเร็จ' + (userForm.create_user ? ' พร้อมบัญชีผู้ใช้' : ''));
      }
      setDialogOpen(false); fetchData();
    } catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await employeesApi.remove(deleteId); showSnack('ลบข้อมูลสำเร็จ'); setDeleteId(null); fetchData(); }
    catch (err) { showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error'); }
  };

  const statusColors = { active: 'success', resigned: 'error', suspended: 'warning' };
  const statusLabels = { active: 'ทำงาน', resigned: 'ลาออก', suspended: 'พักงาน' };

  const columns = [
    { field: 'employee_code', headerName: 'รหัส', width: 110 },
    {
      field: 'profile_image', headerName: '', width: 60,
      renderCell: (p) => <Avatar src={p.value ? `/uploads/${p.value}` : ''} sx={{ width: 36, height: 36 }}>{p.row.first_name[0]}</Avatar>
    },
    { field: 'first_name', headerName: 'ชื่อ', width: 120, valueGetter: (p) => `${p.row.prefix || ''} ${p.row.first_name} ${p.row.last_name}` },
    { field: 'position_name_th', headerName: 'ตำแหน่ง', width: 150 },
    { field: 'employment_type_name_th', headerName: 'ประเภทการจ้าง', width: 140 },
    { field: 'phone', headerName: 'โทรศัพท์', width: 120 },
    {
      field: 'status', headerName: 'สถานะ', width: 100,
      renderCell: (p) => <Chip label={statusLabels[p.value] || p.value} color={statusColors[p.value] || 'default'} size="small" />
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
    `${r.first_name} ${r.last_name} ${r.employee_code}`.toLowerCase().includes(search.toLowerCase())
  );

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target?.value !== undefined ? e.target.value : e }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">พนักงาน (Employees)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่ม</Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <TextField placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 2, width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <DataGrid rows={filtered} columns={columns} loading={loading} autoHeight pageSizeOptions={[25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItem ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</DialogTitle>
        <Tabs value={tabVal} onChange={(_, v) => setTabVal(v)} sx={{ px: 3 }}>
          <Tab label="ข้อมูลทั่วไป" />
          <Tab label="เงินเดือน/ค่าแรง" />
          {!editItem && <Tab label="บัญชีผู้ใช้" />}
        </Tabs>
        <DialogContent>
          {tabVal === 0 && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={2}><TextField label="คำนำหน้า" value={form.prefix} onChange={setF('prefix')} fullWidth /></Grid>
              <Grid item xs={12} sm={5}><TextField label="ชื่อ" value={form.first_name} onChange={setF('first_name')} required fullWidth /></Grid>
              <Grid item xs={12} sm={5}><TextField label="นามสกุล" value={form.last_name} onChange={setF('last_name')} required fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="เลขบัตรประชาชน" value={form.id_card_number} onChange={setF('id_card_number')} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="วันที่เริ่มงาน" type="date" value={form.hire_date} onChange={setF('hire_date')} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="เบอร์โทร" value={form.phone} onChange={setF('phone')} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="อีเมล" value={form.email} onChange={setF('email')} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="ที่อยู่" value={form.address} onChange={setF('address')} multiline rows={2} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField select label="ตำแหน่ง" value={form.position_id} onChange={setF('position_id')} fullWidth>
                <MenuItem value="">-</MenuItem>{positions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name_th}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select label="ประเภทการจ้าง" value={form.employment_type_id} onChange={setF('employment_type_id')} fullWidth>
                <MenuItem value="">-</MenuItem>{employmentTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name_th}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select label="สถานะ" value={form.status} onChange={setF('status')} fullWidth>
                <MenuItem value="active">ทำงาน</MenuItem>
                <MenuItem value="resigned">ลาออก</MenuItem>
                <MenuItem value="suspended">พักงาน</MenuItem>
              </TextField></Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
                    รูปถ่าย<input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setProfileFile(f); setProfilePreview(URL.createObjectURL(f)); } }} />
                  </Button>
                  {profilePreview && <Avatar src={profilePreview} sx={{ width: 64, height: 64 }} />}
                </Box>
              </Grid>
            </Grid>
          )}
          {tabVal === 1 && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}><TextField label="เงินเดือน/ค่าแรง/อัตราต่อชิ้น (บาท)" type="number" value={form.base_salary} onChange={setF('base_salary')} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="อัตรา OT (x1.5, x2, x3)" type="number" value={form.ot_rate_multiplier} onChange={setF('ot_rate_multiplier')} fullWidth /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.has_ot} onChange={(e) => setForm((p) => ({ ...p, has_ot: e.target.checked }))} />} label="มี OT" /></Grid>
            </Grid>
          )}
          {tabVal === 2 && !editItem && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={userForm.create_user} onChange={(e) => setUserForm((p) => ({ ...p, create_user: e.target.checked }))} />}
                  label="สร้างบัญชีผู้ใช้สำหรับพนักงานคนนี้"
                />
              </Grid>
              {userForm.create_user && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 1 }}>พนักงานจะใช้ username/password นี้เพื่อเข้าสู่ระบบ</Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Username" value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select label="Role" value={userForm.user_role} onChange={(e) => setUserForm((p) => ({ ...p, user_role: e.target.value }))} fullWidth>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Password" type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="ยืนยัน Password" type="password" value={userForm.confirm_password} onChange={(e) => setUserForm((p) => ({ ...p, confirm_password: e.target.value }))}
                      fullWidth required error={userForm.confirm_password !== '' && userForm.password !== userForm.confirm_password}
                      helperText={userForm.confirm_password !== '' && userForm.password !== userForm.confirm_password ? 'Password ไม่ตรงกัน' : ''} />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleteId)} title="ยืนยันการลบ" message="คุณต้องการลบพนักงานนี้ใช่หรือไม่?" onConfirm={handleDelete} onClose={() => setDeleteId(null)} />
      <AppSnackbar {...snack} onClose={closeSnack} />
    </Box>
  );
}
