export default function Header({ title, subtitle, breadcrumbs }) {
  return (
    <header className="mb-7">
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-xs text-[#7c6fa0] mb-2 font-medium">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#d6d0e3]">›</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-primary-700' : ''}>{b}</span>
            </span>
          ))}
        </div>
      )}
      <h1 className="text-2xl font-bold text-[#1e1042] tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[#7c6fa0]">{subtitle}</p>}
    </header>
  );
}
