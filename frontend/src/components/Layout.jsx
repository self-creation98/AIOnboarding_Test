import { Outlet, Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/api/client';
import Sidebar from './Sidebar';

export default function Layout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-[220px] px-8 py-6 max-w-[1200px]">
        <Outlet />
      </main>
    </div>
  );
}
