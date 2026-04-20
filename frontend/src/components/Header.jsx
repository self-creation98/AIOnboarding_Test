import { Search, Bell } from 'lucide-react';
import { getUser } from '@/api/client';

export default function Header({ title, subtitle }) {
  const user = getUser();
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'HR';

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-[13px] text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
    </header>
  );
}
