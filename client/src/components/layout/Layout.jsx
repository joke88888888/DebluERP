import React, { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Collapse, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Inventory, Label, ViewList,
  Numbers, Category, Settings as SettingsIcon, Palette, Straighten, WcOutlined,
  Map, Store, LocalOffer, MonetizationOn, ChevronRight, ExpandMore, Logout, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'พนักงาน', icon: <People />, path: '/employees' },
  {
    label: 'สินค้า', icon: <Inventory />, children: [
      { label: 'แบรนด์', icon: <Label />, path: '/brands' },
      { label: 'รุ่น', icon: <ViewList />, path: '/models' },
      { label: 'เวอร์ชัน', icon: <Numbers />, path: '/versions' },
      { label: 'ประเภทสินค้า', icon: <Category />, path: '/categories' },
      { label: 'วิธีการผลิต', icon: <SettingsIcon />, path: '/production-methods' },
      { label: 'สี', icon: <Palette />, path: '/colors' },
      { label: 'ขนาด', icon: <Straighten />, path: '/sizes' },
      { label: 'เพศ', icon: <WcOutlined />, path: '/genders' },
      { label: 'รายการสินค้า', icon: <Inventory />, path: '/products' },
    ]
  },
  { label: 'ภูมิภาค', icon: <Map />, path: '/regions' },
  { label: 'ร้านค้า/ลูกค้า', icon: <Store />, path: '/customers' },
  { label: 'โค้ดส่วนลด', icon: <LocalOffer />, path: '/discount-codes' },
  { label: 'เงื่อนไข Commission', icon: <MonetizationOn />, path: '/commission-rules' },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavClick = (item) => {
    if (item.children) {
      setProductsOpen((o) => !o);
    } else {
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isProductActive = menuItems.find(m => m.children)?.children?.some(c => location.pathname.startsWith(c.path));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flex: 1, py: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.label}>
            <ListItem disablePadding>
              <ListItemButton
                selected={item.path ? isActive(item.path) : isProductActive}
                onClick={() => handleNavClick(item)}
                sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: (item.path ? isActive(item.path) : isProductActive) ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.children && (productsOpen ? <ExpandMore /> : <ChevronRight />)}
              </ListItemButton>
            </ListItem>
            {item.children && (
              <Collapse in={productsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.path} disablePadding>
                      <ListItemButton
                        selected={isActive(child.path)}
                        onClick={() => { navigate(child.path); setMobileOpen(false); }}
                        sx={{ pl: 4, borderRadius: 1, mx: 1, mb: 0.25 }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: isActive(child.path) ? 'primary.main' : 'inherit' }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 14 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Deblu ERP</Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
              {user?.first_name?.[0] || user?.username?.[0] || 'A'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Person sx={{ mr: 1 }} />
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { logout(); navigate('/login'); }}>
              <Logout sx={{ mr: 1 }} /> ออกจากระบบ
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', top: 64 } }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: 3, ml: { md: `${DRAWER_WIDTH}px` }, mt: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
