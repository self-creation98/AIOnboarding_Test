import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '@/api/client';
import {
  LayoutDashboard,
  Gamepad2,
  FileText,
  MessageSquare,
  ClipboardList,
  Sparkles,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS_HR = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/mock-panel', icon: Gamepad2, label: 'Mock Panel' },
  { path: '/documents', icon: FileText, label: 'Knowledge Base' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/stakeholder-tasks', icon: ClipboardList, label: 'Tasks' },
];

const NAV_ITEMS_EMP = [
  { path: '/', icon: Sparkles, label: 'My Onboarding' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();
  const role = user?.vai_tro || 'hr_admin';
  const NAV_ITEMS = role === 'nhan_vien_moi' ? NAV_ITEMS_EMP : NAV_ITEMS_HR;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-zinc-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-zinc-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">AI Onboarding</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
          >
            {({ isActive }) => (
              <div
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-[13px] font-medium text-zinc-700">{user?.full_name || 'HR Admin'}</div>
            <div className="truncate text-[11px] text-zinc-400">{user?.vai_tro || 'hr_admin'}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
