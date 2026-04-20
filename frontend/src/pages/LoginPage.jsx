import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login, setAuth, isAuthenticated } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.access_token) {
        setAuth(data.access_token, data.user || { email, vai_tro: 'hr_admin', full_name: email.split('@')[0] });
        window.location.href = '/';
      } else setError(data.detail || data.error || 'Đăng nhập thất bại');
    } catch (err) { setError('Không thể kết nối server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf9fb] via-primary-50/30 to-[#faf9fb]">
      <div className="w-full max-w-[380px] mx-4">
        <div className="rounded-2xl border border-[#eeedf0] bg-white p-8 shadow-md">
          <div className="text-center mb-7">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 mb-4 shadow-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-[#1a1523]">AI Onboarding</h1>
            <p className="mt-1 text-sm text-[#9e97b0]">Đăng nhập vào hệ thống</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#6e6880] mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" required autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#6e6880] mb-1.5 block">Mật khẩu</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-[#d4d0de]">Demo: admin@company.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
