import { cn } from '@/lib/utils';

const segments = [
  { key: 'green', label: 'Healthy', color: 'bg-emerald-400', dot: 'bg-emerald-400' },
  { key: 'yellow', label: 'At Risk', color: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'red', label: 'Critical', color: 'bg-red-400', dot: 'bg-red-400' },
];

export default function HealthIndicator({ distribution, className }) {
  if (!distribution) return null;
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#eeedf0]">
        {segments.map(seg => {
          const val = distribution[seg.key] || 0;
          const pct = (val / total) * 100;
          if (pct === 0) return null;
          return <div key={seg.key} className={cn('h-full first:rounded-l-full last:rounded-r-full', seg.color)} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="flex gap-5">
        {segments.map(seg => {
          const val = distribution[seg.key] || 0;
          return (
            <div key={seg.key} className="flex items-center gap-1.5 text-sm">
              <div className={cn('h-2 w-2 rounded-full', seg.dot)} />
              <span className="text-[#9e97b0]">{seg.label}</span>
              <span className="font-semibold text-[#1a1523]">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
