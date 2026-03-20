import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

import LoginPage      from './pages/LoginPage';
import SchedulePage   from './pages/SchedulePage';
import AdminLayout    from './pages/admin/AdminLayout';
import DashboardPage  from './pages/admin/DashboardPage';
import RoomsPage      from './pages/admin/RoomsPage';
import TimeSlotsPage  from './pages/admin/TimeSlotsPage';
import UsersPage      from './pages/admin/UsersPage';
import SettingsPage   from './pages/admin/SettingsPage';
import BackupPage     from './pages/admin/BackupPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index        element={<DashboardPage />} />
        <Route path="rooms"     element={<RoomsPage />} />
        <Route path="timeslots" element={<TimeSlotsPage />} />
        <Route path="users"     element={<UsersPage />} />
        <Route path="settings"  element={<SettingsPage />} />
        <Route path="backup"    element={<BackupPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
