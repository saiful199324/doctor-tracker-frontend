import { formatNumber } from '@/lib/utils';

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipEntry[];
  labelFormatter?: (label: string) => string;
}

/** Shared tooltip so every chart looks the same and follows the theme. */
export function ChartTooltip({ active, payload, label, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-surface/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {label !== undefined && label !== '' && (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(String(label)) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-full" style={{ background: entry.color ?? entry.payload?.fill }} />
              {entry.name}
            </span>
            <span className="font-semibold text-foreground tabular-nums">{formatNumber(Number(entry.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const axisProps = {
  tick: { fill: 'var(--muted)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;
