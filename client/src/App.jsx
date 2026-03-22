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

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Sarabun", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  }
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
