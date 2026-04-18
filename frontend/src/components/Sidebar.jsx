import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../api/client';

const NAV_ITEMS_HR = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/mock-panel', icon: '🎮', label: 'Mock Panel' },
  { path: '/documents', icon: '📄', label: 'Knowledge Base' },
  { path: '/chat', icon: '💬', label: 'AI Chat' },
  { path: '/stakeholder-tasks', icon: '📋', label: 'Tasks' },
];

const NAV_ITEMS_EMP = [
  { path: '/', icon: '👋', label: 'My Onboarding' },
  { path: '/chat', icon: '💬', label: 'AI Chat' },
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
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🚀</div>
        <span>AI Onboarding</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.full_name || 'HR Admin'}</div>
            <div className="user-role">{user?.vai_tro || 'hr_admin'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
}
