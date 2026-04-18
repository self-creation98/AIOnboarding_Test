import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setAuth, isAuthenticated } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.access_token) {
        setAuth(data.access_token, data.user || { email, vai_tro: 'hr_admin', full_name: email.split('@')[0] });
        navigate('/');
      } else {
        setError(data.detail || data.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Không thể kết nối server. Kiểm tra backend đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-section">
          <div className="icon">🚀</div>
          <h1>AI Onboarding</h1>
          <p>Hệ thống onboarding thông minh</p>
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading} type="submit">
            {loading ? '⏳ Đang xử lý...' : '🔑 Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Demo: admin@company.com / 123456
        </p>
      </div>
    </div>
  );
}
