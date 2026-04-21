import { cn } from '@/lib/utils';

const segments = [
  { key: 'green', label: 'Healthy', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'yellow', label: 'At Risk', color: 'bg-amber-400', dot: 'bg-amber-400' },
  { key: 'red', label: 'Critical', color: 'bg-red-500', dot: 'bg-red-500' },
];

export default function HealthIndicator({ distribution, className }) {
  if (!distribution) return null;
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
        {segments.map(seg => {
          const val = distribution[seg.key] || 0;
          const pct = (val / total) * 100;
          if (pct === 0) return null;
          return <div key={seg.key} className={cn('h-full first:rounded-l-full last:rounded-r-full', seg.color)} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="flex gap-6">
        {segments.map(seg => (
          <div key={seg.key} className="flex items-center gap-2 text-sm">
            <div className={cn('h-2.5 w-2.5 rounded-full', seg.dot)} />
            <span className="text-[#7c6fa0] font-medium">{seg.label}</span>
            <span className="font-bold text-[#1e1042]">{distribution[seg.key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
