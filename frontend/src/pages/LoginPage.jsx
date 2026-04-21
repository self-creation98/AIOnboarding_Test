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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-[#f8f7fc] to-primary-50">
      <div className="w-full max-w-[400px] mx-4">
        <div className="rounded-3xl bg-white p-9 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700 mb-4 shadow-md">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1e1042]">AI Onboarding</h1>
            <p className="mt-1 text-sm text-[#7c6fa0]">Đăng nhập vào hệ thống</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#4a3f6b] mb-2 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" required autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#4a3f6b] mb-2 block">Mật khẩu</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#b0a5c8]">Demo: admin@company.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
