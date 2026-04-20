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

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.access_token) {
        setAuth(data.access_token, data.user || { email, vai_tro: 'hr_admin', full_name: email.split('@')[0] });
        window.location.href = '/';
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-[360px] mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">AI Onboarding</h1>
          <p className="mt-1 text-sm text-zinc-400">Đăng nhập vào hệ thống</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" required autoComplete="email" />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Mật khẩu</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-300">Demo: admin@company.com / 123456</p>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-6 text-center">
          <p className="text-xs text-zinc-400">Powered by AI Onboarding Platform</p>
        </div>
      </div>
    </div>
  );
}
