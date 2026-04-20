import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, trend, className }) {
  return (
    <div className={cn(
      'rounded-lg border border-zinc-200 bg-white p-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-zinc-500">{label}</span>
        {typeof Icon === 'string' ? (
          <span className="text-sm">{Icon}</span>
        ) : (
          <Icon className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-zinc-900">{value}</span>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
