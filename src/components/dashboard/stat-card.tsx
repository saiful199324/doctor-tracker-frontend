import { memo, type ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  hint?: ReactNode;
  trend?: number | null;
  /** When true a rising trend is bad (e.g. critical patients). */
  invertTrend?: boolean;
}

export const StatCard = memo(function StatCard({ label, value, icon, accent, hint, trend, invertTrend }: StatCardProps) {
  const positive = trend != null && (invertTrend ? trend < 0 : trend >= 0);
  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className="absolute -top-8 -right-8 size-28 rounded-full opacity-[0.08]"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5"
          style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        {trend != null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold',
              positive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-danger-soft text-danger',
            )}
          >
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend)}%
          </span>
        )}
        {hint}
      </div>
    </Card>
  );
});

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-4 h-3 w-32" />
    </Card>
  );
}
