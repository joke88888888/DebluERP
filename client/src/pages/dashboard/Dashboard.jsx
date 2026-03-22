import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { People, Inventory, Store, Label } from '@mui/icons-material';

const StatCard = ({ title, icon, color }) => (
  <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>
      {icon}
    </Box>
    <Typography variant="h6">{title}</Typography>
  </Paper>
);

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="พนักงาน" icon={<People />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="สินค้า" icon={<Inventory />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="ลูกค้า" icon={<Store />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="แบรนด์" icon={<Label />} color="info" />
        </Grid>
      </Grid>
    </Box>
  );
}
