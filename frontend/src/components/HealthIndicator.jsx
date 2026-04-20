import { cn } from '@/lib/utils';

const segments = [
  { key: 'green', label: 'Healthy', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'yellow', label: 'At Risk', color: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'red', label: 'Critical', color: 'bg-red-500', dot: 'bg-red-500' },
];

export default function HealthIndicator({ distribution, className }) {
  if (!distribution) return null;
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        {segments.map(seg => {
          const value = distribution[seg.key] || 0;
          const pct = (value / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={seg.key} className={cn('h-full first:rounded-l-full last:rounded-r-full', seg.color)} style={{ width: `${pct}%` }} />
          );
        })}
      </div>

      {/* Legend — inline */}
      <div className="flex gap-5">
        {segments.map(seg => {
          const value = distribution[seg.key] || 0;
          return (
            <div key={seg.key} className="flex items-center gap-1.5 text-sm">
              <div className={cn('h-2 w-2 rounded-full', seg.dot)} />
              <span className="text-zinc-500">{seg.label}</span>
              <span className="font-medium text-zinc-900">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
