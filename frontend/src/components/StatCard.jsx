import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, className }) {
  return (
    <div className={cn('rounded-2xl bg-white p-5 shadow-card transition-all hover:shadow-md', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-[#7c6fa0]">{label}</span>
        {typeof Icon === 'string' ? (
          <span className="text-lg">{Icon}</span>
        ) : Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100">
            <Icon className="h-4 w-4 text-primary-700" />
          </div>
        ) : null}
      </div>
      <div className="text-3xl font-bold tracking-tight text-[#1e1042] leading-none">{value}</div>
      {trendLabel && <p className="mt-2 text-xs text-[#7c6fa0]">{trendLabel}</p>}
    </div>
  );
}
