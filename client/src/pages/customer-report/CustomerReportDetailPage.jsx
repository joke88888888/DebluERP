import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Divider,
  Table, TableHead, TableBody, TableRow, TableCell, Card, CardContent,
  Tabs, Tab, Alert, CircularProgress
} from '@mui/material';
import { ArrowBack, Store, AccountBalance, People, History, ShoppingCart } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

const fmtMoney = (v) => Number(v || 0).toLocaleString('th-TH');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH') : '-';

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function CustomerReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api.get(`/customer-report/customers/${id}`)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!data) return <Alert severity="error" sx={{ m: 3 }}>ไม่พบข้อมูลลูกค้า</Alert>;

  const address = [data.house_number, data.moo ? `หมู่ ${data.moo}` : '', data.soi ? `ซ.${data.soi}` : '', data.road ? `ถ.${data.road}` : '', data.tambon, data.amphoe, data.province_name, data.zipcode].filter(Boolean).join(' ');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/customer-report')} variant="outlined">กลับ</Button>
        <Store sx={{ color: 'primary.main', fontSize: 28 }} />
        <Box>
          <Typography variant="h5">{data.company_name}</Typography>
          <Typography variant="caption" fontFamily="monospace" color="text.secondary">{data.customer_code}</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Chip label={data.status === 'active' ? 'ใช้งาน' : 'ปิด'} color={data.status === 'active' ? 'success' : 'default'} />
      </Box>

      {/* Credit Summary Banner */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">วงเงินเครดิตรวม</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">{fmtMoney(data.totalCredit)} ฿</Typography>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {data.credits?.map(cr => (
                <Paper key={cr.id} variant="outlined" sx={{ px: 2, py: 1, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{cr.brand_name}</Typography>
                  <Typography fontWeight={700} color="primary">{fmtMoney(cr.credit_limit)} ฿</Typography>
                  <Typography variant="caption" color="text.secondary"> {cr.credit_days} วัน</Typography>
                </Paper>
              ))}
              {(!data.credits || data.credits.length === 0) && <Typography variant="body2" color="text.disabled">ไม่มีวงเงินเครดิต</Typography>}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<Store fontSize="small" />} iconPosition="start" label="ข้อมูลลูกค้า" />
        <Tab icon={<People fontSize="small" />} iconPosition="start" label={`ร้านย่อย (${data.subCustomers?.length || 0})`} />
        <Tab icon={<History fontSize="small" />} iconPosition="start" label="ประวัติการชำระ" />
        <Tab icon={<ShoppingCart fontSize="small" />} iconPosition="start" label="ประวัติสั่งซื้อ" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>ข้อมูลทั่วไป</Typography>
              <InfoRow label="รหัสลูกค้า" value={data.customer_code} />
              <InfoRow label="ชื่อบริษัท/ร้าน" value={data.company_name} />
              <InfoRow label="เลขบัตรประชาชน" value={data.id_card_number} />
              <InfoRow label="VAT" value={data.is_vat ? `มี VAT (${data.tax_id || '-'})` : 'ไม่มี VAT'} />
              <InfoRow label="ที่อยู่" value={address || '-'} />
              <InfoRow label="เขตการขาย" value={data.sales_zone} />
              <InfoRow label="ภูมิภาค" value={data.region_name} />
              <InfoRow label="บริษัทขนส่ง" value={data.transport_name} />
              <InfoRow label="จำนวนลัง" value={data.boxes_per_shipment ? `${data.boxes_per_shipment} ลัง` : '-'} />
              <InfoRow label="เซลล์ที่ดูแล" value={data.sales_first_name ? `${data.sales_first_name} ${data.sales_last_name}` : '-'} />
              <InfoRow label="วันที่เริ่มเป็นลูกค้า" value={fmtDate(data.customer_since)} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>ข้อมูลติดต่อ</Typography>
              {data.contacts?.length === 0 && <Typography variant="body2" color="text.disabled">ไม่มีข้อมูลติดต่อ</Typography>}
              {data.contacts?.map((ct, i) => (
                <Box key={ct.id || i} sx={{ mb: i < data.contacts.length - 1 ? 2 : 0 }}>
                  {ct.contact_name && <Typography fontWeight={600}>{ct.contact_name} {ct.contact_position ? `(${ct.contact_position})` : ''}</Typography>}
                  {ct.phone && <Typography variant="body2">📞 {ct.phone}{ct.phone_backup ? ` / ${ct.phone_backup}` : ''}</Typography>}
                  {ct.email && <Typography variant="body2">✉️ {ct.email}</Typography>}
                  {ct.line_id && <Typography variant="body2">💬 Line: {ct.line_id}</Typography>}
                  {ct.facebook && <Typography variant="body2">👤 FB: {ct.facebook}</Typography>}
                  {i < data.contacts.length - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>บัญชีธนาคาร</Typography>
              {data.bankAccounts?.length === 0 && <Typography variant="body2" color="text.disabled">ไม่มีบัญชีธนาคาร</Typography>}
              {data.bankAccounts?.map((ba, i) => (
                <Box key={ba.id || i} sx={{ mb: 1 }}>
                  <Typography fontWeight={600}>{ba.bank_name} {ba.is_primary ? <Chip label="หลัก" size="small" color="primary" /> : null}</Typography>
                  <Typography variant="body2">{ba.account_number} — {ba.account_name}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>รหัส</TableCell>
                <TableCell>ชื่อร้านค้า</TableCell>
                <TableCell>จังหวัด</TableCell>
                <TableCell>เครดิตร่วม</TableCell>
                <TableCell>สถานะ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.subCustomers?.map(sc => (
                <TableRow key={sc.id} hover>
                  <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{sc.sub_customer_code}</Typography></TableCell>
                  <TableCell><Typography fontWeight={600}>{sc.company_name}</Typography></TableCell>
                  <TableCell>{sc.province_name || '-'}</TableCell>
                  <TableCell>{sc.shared_credit_customer_id ? 'ใช้เครดิตร่วม' : '-'}</TableCell>
                  <TableCell><Chip label={sc.status === 'active' ? 'ใช้งาน' : 'ปิด'} color={sc.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                </TableRow>
              ))}
              {(!data.subCustomers || data.subCustomers.length === 0) && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่มีลูกค้าย่อย</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>ประวัติการชำระเงินจะแสดงเมื่อมีข้อมูล transaction</Alert>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>ประวัติการสั่งซื้อจะแสดงเมื่อมีข้อมูล transaction</Alert>
      </TabPanel>
    </Box>
  );
}
