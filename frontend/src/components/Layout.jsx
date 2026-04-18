import { Outlet, Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/client';
import Sidebar from './Sidebar';

export default function Layout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
