import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip,
  Table, TableHead, TableBody, TableRow, TableCell,
  TextField, InputAdornment, Alert, CircularProgress,
  Divider, LinearProgress, Tooltip, IconButton
} from '@mui/material';
import { Assessment, TrendingUp, Store, People, AccountBalance, Search, OpenInNew, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const fmtMoney = (v) => Number(v || 0).toLocaleString('th-TH');

function SummaryCard({ icon, label, value, sub, color = 'primary' }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: `${color}.200`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: `${color}.50`, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 28 } })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
            <Typography variant="h5" fontWeight={700} color={`${color}.main`}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CustomerReportPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, custRes] = await Promise.all([
        api.get('/customer-report/summary'),
        api.get('/customer-report/customers', { params: { q, limit: 100 } }),
      ]);
      setSummary(sumRes.data.data);
      setCustomers(custRes.data.data || []);
      setTotal(custRes.data.total || 0);
    } catch (e) {
      setError('โหลดข้อมูลล้มเหลว');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeCount = summary?.statusBreakdown?.find(s => s.status === 'active')?.count || 0;
  const inactiveCount = summary?.statusBreakdown?.find(s => s.status === 'inactive')?.count || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Assessment sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h5">รายงานสรุปลูกค้า</Typography>
          <Typography variant="body2" color="text.secondary">ภาพรวมลูกค้าและข้อมูลเครดิต</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard icon={<Store />} label="ลูกค้าหลักทั้งหมด" value={summary?.total_customers || 0} sub={`ใช้งาน ${activeCount} | ปิด ${inactiveCount}`} color="primary" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard icon={<People />} label="ลูกค้าย่อยทั้งหมด" value={summary?.total_sub_customers || 0} color="secondary" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard icon={<AccountBalance />} label="วงเงินเครดิตรวม" value={`${fmtMoney(summary?.total_credit_limit)} ฿`} sub={`${summary?.customers_with_credit || 0} ร้านมีเครดิต`} color="success" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard icon={<TrendingUp />} label="ยอดค้างชำระ" value="0 ฿" sub="(รอข้อมูล transaction)" color="warning" />
            </Grid>
          </Grid>

          {/* Brand Breakdown */}
          {summary?.brandBreakdown?.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>วงเงินเครดิตแยกตามแบรนด์</Typography>
              <Grid container spacing={2}>
                {summary.brandBreakdown.map(b => (
                  <Grid item xs={6} sm={4} md={3} key={b.brand_id}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: 'primary.100' }}>
                      <Typography variant="subtitle2" color="primary.main" fontWeight={700}>{b.brand_name}</Typography>
                      <Typography variant="h6" fontWeight={700}>{fmtMoney(b.total_credit_limit)} ฿</Typography>
                      <Typography variant="caption" color="text.secondary">{b.customer_count} ลูกค้า | เฉลี่ย {Math.round(b.avg_credit_days)} วัน</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Customer List */}
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>รายชื่อลูกค้า ({total} ร้าน)</Typography>
              <TextField placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)} size="small" sx={{ width: 240 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
            </Box>
            <Divider />
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>รหัส / ชื่อ</TableCell>
                  <TableCell>จังหวัด</TableCell>
                  <TableCell>เครดิตแต่ละแบรนด์</TableCell>
                  <TableCell align="right">วงเงินรวม</TableCell>
                  <TableCell align="center">ร้านย่อย</TableCell>
                  <TableCell align="center">สถานะ</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customer-report/${c.id}`)}>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">{c.customer_code}</Typography>
                      <Typography fontWeight={600}>{c.company_name}</Typography>
                      {c.sales_first_name && <Typography variant="caption" color="text.secondary">เซลล์: {c.sales_first_name} {c.sales_last_name}</Typography>}
                    </TableCell>
                    <TableCell>{c.province_name || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {c.credits?.map(cr => (
                          <Tooltip key={cr.brand_id || cr.brand_name} title={`${cr.credit_days} วัน`}>
                            <Chip label={`${cr.brand_name}: ${fmtMoney(cr.credit_limit)}฿`} size="small" variant="outlined" color="primary" />
                          </Tooltip>
                        ))}
                        {(!c.credits || c.credits.length === 0) && <Typography variant="caption" color="text.disabled">ไม่มีเครดิต</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="primary.main">{fmtMoney(c.total_credit_limit)} ฿</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={c.sub_customer_count} size="small" color={c.sub_customer_count > 0 ? 'secondary' : 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={c.status === 'active' ? 'ใช้งาน' : 'ปิด'} color={c.status === 'active' ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/customer-report/${c.id}`); }}>
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่มีข้อมูล</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
}
