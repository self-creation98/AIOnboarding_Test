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
  Settings,
  Bell,
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
    <aside className="fixed inset-y-0 left-0 z-50 flex w-16 flex-col items-center bg-white border-r border-[#eeedf0] py-4">
      {/* Logo */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 mb-6">
        <Sparkles className="h-5 w-5 text-white" />
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} title={item.label}>
            {({ isActive }) => (
              <div className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-[#9e97b0] hover:bg-[#f5f3ff] hover:text-primary-500'
              }`}>
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-[#1a1523] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9e97b0] hover:bg-[#f5f3ff] hover:text-primary-500 transition-colors" title="Notifications">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9e97b0] hover:bg-[#f5f3ff] hover:text-primary-500 transition-colors" title="Settings">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9e97b0] hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[10px] font-bold text-white ring-2 ring-primary-100">
          {initials}
        </div>
      </div>
    </aside>
  );
}
