import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { ToastProvider } from '../../components/common/Toast';

export default function AdminLayout() {
  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar title="Panel de Administración" />
        <div className="admin-container">
          <Sidebar />
          <main className="admin-content">
            <div className="admin-content-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
