import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeesPage from './pages/employees/EmployeesPage';
import BrandsPage from './pages/brands/BrandsPage';
import ModelsPage from './pages/models/ModelsPage';
import VersionsPage from './pages/versions/VersionsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import ProductionMethodsPage from './pages/production-methods/ProductionMethodsPage';
import ColorsPage from './pages/colors/ColorsPage';
import SizesPage from './pages/sizes/SizesPage';
import GendersPage from './pages/genders/GendersPage';
import ProductsPage from './pages/products/ProductsPage';
import RegionsPage from './pages/regions/RegionsPage';
import CustomersPage from './pages/customers/CustomersPage';
import DiscountCodesPage from './pages/discount-codes/DiscountCodesPage';
import CommissionRulesPage from './pages/commission-rules/CommissionRulesPage';
import LidMoldsPage from './pages/lid-molds/LidMoldsPage';
import FloorMoldsPage from './pages/floor-molds/FloorMoldsPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0', light: '#1976d2', dark: '#0d47a1' },
    secondary: { main: '#6a1b9a', light: '#7b1fa2', dark: '#4a148c' },
    success: { main: '#2e7d32' },
    background: { default: '#f8f9fb', paper: '#ffffff' },
    divider: 'rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: '"Sarabun", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.08)',
    '0px 2px 6px rgba(0,0,0,0.08)',
    '0px 3px 10px rgba(0,0,0,0.08)',
    '0px 4px 14px rgba(0,0,0,0.10)',
    '0px 6px 20px rgba(0,0,0,0.10)',
    ...Array(19).fill('0px 8px 24px rgba(0,0,0,0.12)'),
  ],
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 }, contained: { boxShadow: '0 2px 6px rgba(0,0,0,0.15)' } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 12 } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, fontSize: 13, color: '#374151' } } },
  },
});

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/employees" element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
            <Route path="/brands" element={<PrivateRoute><BrandsPage /></PrivateRoute>} />
            <Route path="/models" element={<PrivateRoute><ModelsPage /></PrivateRoute>} />
            <Route path="/versions" element={<PrivateRoute><VersionsPage /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
            <Route path="/production-methods" element={<PrivateRoute><ProductionMethodsPage /></PrivateRoute>} />
            <Route path="/colors" element={<PrivateRoute><ColorsPage /></PrivateRoute>} />
            <Route path="/sizes" element={<PrivateRoute><SizesPage /></PrivateRoute>} />
            <Route path="/genders" element={<PrivateRoute><GendersPage /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
            <Route path="/regions" element={<PrivateRoute><RegionsPage /></PrivateRoute>} />
            <Route path="/customers" element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
            <Route path="/discount-codes" element={<PrivateRoute><DiscountCodesPage /></PrivateRoute>} />
            <Route path="/commission-rules" element={<PrivateRoute><CommissionRulesPage /></PrivateRoute>} />
            <Route path="/lid-molds" element={<PrivateRoute><LidMoldsPage /></PrivateRoute>} />
            <Route path="/floor-molds" element={<PrivateRoute><FloorMoldsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
