import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OfficerDashboard from './pages/officer/Dashboard';
import OfficerMenu from './pages/officer/Menu';
import OfficerBill from './pages/officer/Bill';
import OfficerHistory from './pages/officer/History';
import OfficerBar from './pages/officer/Bar';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMenu from './pages/admin/Menu';
import AdminOfficers from './pages/admin/Officers';
import DailyLedger from './pages/admin/DailyLedger';
import KitchenSummary from './pages/admin/KitchenSummary';
import AdminBilling from './pages/admin/Billing';
import AdminInventory from './pages/admin/Inventory';
import AdminMessages from './pages/admin/Messages';
import OfficerMessages from './pages/officer/Messages';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userData?.role !== allowedRole) {
    // Redirect based on role if trying to access unauthorized area
    return userData?.role === 'admin'
      ? <Navigate to="/admin" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Officer Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRole="officer">
              <DashboardLayout role="officer" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboard />} />
            <Route path="menu" element={<OfficerMenu />} />
            <Route path="bill" element={<OfficerBill />} />
            <Route path="history" element={<OfficerHistory />} />
            <Route path="bar" element={<OfficerBar />} />
            <Route path="messages" element={<OfficerMessages />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="officers" element={<AdminOfficers />} />
            <Route path="ledger" element={<DailyLedger />} />
            <Route path="kitchen" element={<KitchenSummary />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
