import { Outlet, Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/api/client';
import Sidebar from './Sidebar';

export default function Layout() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[68px] px-8 py-7 max-w-[1280px]">
        <Outlet />
      </main>
    </div>
  );
}
