import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '@/api/client';
import {
  LayoutDashboard, Gamepad2, FileText, MessageSquare,
  ClipboardList, Sparkles, LogOut, Settings, Bell,
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
  const handleLogout = () => { clearAuth(); navigate('/login'); };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[68px] flex-col items-center bg-white/80 backdrop-blur-sm border-r border-[#e9e5f0] py-5">
      {/* Logo */}
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 shadow-md mb-7">
        <Sparkles className="h-5 w-5 text-white" />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1.5">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} title={item.label}>
            {({ isActive }) => (
              <div className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-700 text-white shadow-md'
                  : 'text-[#7c6fa0] hover:bg-primary-50 hover:text-primary-700'
              }`}>
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-primary-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1.5 mt-auto">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7c6fa0] hover:bg-primary-50 hover:text-primary-700 transition-all" title="Notifications">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7c6fa0] hover:bg-primary-50 hover:text-primary-700 transition-all" title="Settings">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7c6fa0] hover:bg-red-50 hover:text-red-500 transition-all" title="Đăng xuất">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white ring-3 ring-primary-200 shadow-sm">
          {initials}
        </div>
      </div>
    </aside>
  );
}
