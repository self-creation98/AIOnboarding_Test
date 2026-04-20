import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const tintMap = {
  purple: 'bg-primary-50/80 border-primary-100',
  green: 'bg-emerald-50/80 border-emerald-100',
  blue: 'bg-blue-50/80 border-blue-100',
  yellow: 'bg-amber-50/80 border-amber-100',
  red: 'bg-red-50/80 border-red-100',
};

const trendColors = {
  up: 'text-emerald-600 bg-emerald-50',
  down: 'text-red-500 bg-red-50',
};

export default function StatCard({ icon: Icon, label, value, tint = 'purple', trend, trendLabel, className }) {
  const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : null;

  return (
    <div className={cn(
      'rounded-2xl border bg-white p-5 transition-shadow hover:shadow-sm',
      tintMap[tint] || tintMap.purple,
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-[#6e6880]">{label}</span>
        {trendDir && (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', trendColors[trendDir])}>
            {trendDir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-[28px] font-semibold tracking-tight text-[#1a1523] leading-none">{value}</div>
      {trendLabel && (
        <p className="mt-1.5 text-[11px] text-[#9e97b0]">{trendLabel}</p>
      )}
    </div>
  );
}
