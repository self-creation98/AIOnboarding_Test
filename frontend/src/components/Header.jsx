import { getUser } from '@/api/client';

export default function Header({ title, subtitle, breadcrumbs }) {
  return (
    <header className="mb-6">
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-[#9e97b0] mb-2">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#d4d0de]">›</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-[#6e6880]' : ''}>{b}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-[#1a1523] tracking-[-0.01em]">{title}</h1>
        {subtitle && (
          <>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span className="text-sm text-[#6e6880]">{subtitle}</span>
          </>
        )}
      </div>
    </header>
  );
}
