import React, { useState, useEffect, useMemo } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Collapse, Avatar, Menu, MenuItem, Divider, alpha } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Inventory, Label, ViewList,
  Numbers, Category, Settings as SettingsIcon, Palette, Straighten, WcOutlined,
  Map, Store, LocalOffer, MonetizationOn, ChevronRight, ExpandMore, Logout, Person, Storage, Groups,
  Layers, ViewInAr, PrecisionManufacturing, LocalShipping, Assessment, PeopleAlt } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 280;

const masterDataChildren = [
  {
    label: 'HR',
    icon: <Groups />,
    children: [
      { label: 'พนักงาน', icon: <People />, path: '/employees' },
    ],
  },
  {
    label: 'สินค้า',
    icon: <Inventory />,
    children: [
      { label: 'แบรนด์', icon: <Label />, path: '/brands' },
      { label: 'รุ่น', icon: <ViewList />, path: '/models' },
      { label: 'เวอร์ชั่น', icon: <Numbers />, path: '/versions' },
      { label: 'ประเภทสินค้า', icon: <Category />, path: '/categories' },
      { label: 'วิธีการผลิต', icon: <SettingsIcon />, path: '/production-methods' },
      { label: 'สี', icon: <Palette />, path: '/colors' },
      { label: 'ขนาด', icon: <Straighten />, path: '/sizes' },
      { label: 'เพศ', icon: <WcOutlined />, path: '/genders' },
      { label: 'รายการสินค้า', icon: <Inventory />, path: '/products' },
    ],
  },
  {
    label: 'ผลิต',
    icon: <PrecisionManufacturing />,
    children: [
      { label: 'ฝาโมล์', icon: <Layers />, path: '/lid-molds' },
      { label: 'พื้นโมล์', icon: <ViewInAr />, path: '/floor-molds' },
    ],
  },
  {
    label: 'ลูกค้า',
    icon: <PeopleAlt />,
    children: [
      { label: 'ภูมิภาค', icon: <Map />, path: '/regions' },
      { label: 'ลูกค้าหลัก', icon: <Store />, path: '/customers' },
      { label: 'ลูกค้าย่อย', icon: <People />, path: '/sub-customers' },
      { label: 'รายงานสรุปลูกค้า', icon: <Assessment />, path: '/customer-report' },
    ],
  },
  {
    label: 'ขนส่ง',
    icon: <LocalShipping />,
    children: [
      { label: 'Master ขนส่ง', icon: <LocalShipping />, path: '/transport' },
    ],
  },
  { label: 'โค้ดส่วนลด', icon: <LocalOffer />, path: '/discount-codes' },
  { label: 'เงื่อนไข Commission', icon: <MonetizationOn />, path: '/commission-rules' },
];

const menuItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Master Data', icon: <Storage />, children: masterDataChildren },
];

function collectLeafPaths(nodes) {
  const paths = [];
  for (const n of nodes) {
    if (n.path) paths.push(n.path);
    if (n.children) paths.push(...collectLeafPaths(n.children));
  }
  return paths;
}

function findSubgroupForPath(nodes, pathname) {
  for (const n of nodes) {
    if (n.children) {
      for (const leaf of n.children) {
        if (leaf.path === pathname) return n.label;
      }
    }
  }
  return null;
}

const masterLeafPaths = collectLeafPaths(masterDataChildren);

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [openSubgroups, setOpenSubgroups] = useState(() => ({
    HR: false,
    สินค้า: false,
    ผลิต: false,
    ลูกค้า: false,
    ขนส่ง: false,
  }));
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;
  const isMasterDataChildActive = masterLeafPaths.some((p) => location.pathname === p);

  const activeSubgroup = useMemo(
    () => findSubgroupForPath(masterDataChildren, location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    if (isMasterDataChildActive) setMasterDataOpen(true);
  }, [location.pathname, isMasterDataChildActive]);

  useEffect(() => {
    if (activeSubgroup) {
      setOpenSubgroups((prev) => ({ ...prev, [activeSubgroup]: true }));
    }
  }, [activeSubgroup]);

  const toggleSubgroup = (label) => {
    setOpenSubgroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavClick = (item) => {
    if (item.children) {
      setMasterDataOpen((o) => !o);
    } else {
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  const renderMasterChild = (child) => {
    if (child.path) {
      const active = isActive(child.path);
      return (
        <ListItem key={child.path} disablePadding>
          <ListItemButton
            selected={active}
            onClick={() => { navigate(child.path); setMobileOpen(false); }}
            sx={{
              pl: 3, borderRadius: 1.5, mx: 1, mb: 0.25,
              '&.Mui-selected': { bgcolor: alpha('#1976d2', 0.12), color: 'primary.main' },
              '&.Mui-selected:hover': { bgcolor: alpha('#1976d2', 0.18) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.main' : 'text.secondary' }}>
              {React.cloneElement(child.icon, { fontSize: 'small' })}
            </ListItemIcon>
            <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
          </ListItemButton>
        </ListItem>
      );
    }

    const subgroupActive = child.children.some((leaf) => isActive(leaf.path));

    return (
      <React.Fragment key={child.label}>
        <ListItem disablePadding>
          <ListItemButton
            selected={subgroupActive}
            onClick={() => toggleSubgroup(child.label)}
            sx={{
              pl: 3, borderRadius: 1.5, mx: 1, mb: 0.25,
              '&.Mui-selected': { bgcolor: alpha('#1976d2', 0.08) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: subgroupActive ? 'primary.main' : 'text.secondary' }}>
              {React.cloneElement(child.icon, { fontSize: 'small' })}
            </ListItemIcon>
            <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            {openSubgroups[child.label] ? <ExpandMore fontSize="small" sx={{ color: 'text.secondary' }} /> : <ChevronRight fontSize="small" sx={{ color: 'text.secondary' }} />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openSubgroups[child.label]} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {child.children.map((leaf) => {
              const leafActive = isActive(leaf.path);
              return (
                <ListItem key={leaf.path} disablePadding>
                  <ListItemButton
                    selected={leafActive}
                    onClick={() => { navigate(leaf.path); setMobileOpen(false); }}
                    sx={{
                      pl: 5.5, borderRadius: 1.5, mx: 1, mb: 0.25,
                      '&.Mui-selected': {
                        bgcolor: alpha('#1976d2', 0.12), color: 'primary.main',
                        borderLeft: '3px solid', borderColor: 'primary.main', pl: 5,
                      },
                      '&.Mui-selected:hover': { bgcolor: alpha('#1976d2', 0.18) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: leafActive ? 'primary.main' : 'text.secondary' }}>
                      {React.cloneElement(leaf.icon, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText primary={leaf.label} primaryTypographyProps={{ fontSize: 13, fontWeight: leafActive ? 600 : 400 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Sidebar brand header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 1, fontSize: 11 }}>
          DEBLU ERP
        </Typography>
      </Box>
      <List sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const active = item.path ? isActive(item.path) : isMasterDataChildActive;
          return (
            <React.Fragment key={item.label}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={active}
                  onClick={() => handleNavClick(item)}
                  sx={{
                    borderRadius: 1.5, mx: 1, mb: 0.5,
                    '&.Mui-selected': { bgcolor: alpha('#1976d2', 0.1), color: 'primary.main' },
                    '&.Mui-selected:hover': { bgcolor: alpha('#1976d2', 0.16) },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
                  {item.children && (masterDataOpen ? <ExpandMore sx={{ color: 'text.secondary' }} /> : <ChevronRight sx={{ color: 'text.secondary' }} />)}
                </ListItemButton>
              </ListItem>
              {item.children && (
                <Collapse in={masterDataOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => renderMasterChild(child))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, letterSpacing: 0.5 }}>Deblu ERP</Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 700 }}>
              {user?.first_name?.[0] || user?.username?.[0] || 'A'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 200, borderRadius: 2 } }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">{user?.role || 'User'}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ mt: 0.5, color: 'error.main' }}>
              <Logout sx={{ mr: 1, fontSize: 18 }} /> ออกจากระบบ
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', top: 64, borderRight: '1px solid', borderColor: 'divider' }
        }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{
        flex: 1, p: 3, ml: { md: `${DRAWER_WIDTH}px` }, mt: 8,
        bgcolor: '#f8f9fb', minHeight: '100vh'
      }}>
        {children}
      </Box>
    </Box>
  );
}
