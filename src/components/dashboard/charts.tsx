'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { Overview } from '@/lib/types';
import { capitalize, CONDITION_META, formatNumber } from '@/lib/utils';
import { axisProps, ChartTooltip } from './chart-tooltip';

const DATE_FORMATS: Record<Overview['unit'], { axis: string; tooltip: string }> = {
  day: { axis: 'd MMM', tooltip: 'EEE, d MMM yyyy' },
  week: { axis: 'd MMM', tooltip: "'Week of' d MMM yyyy" },
  month: { axis: 'MMM yy', tooltip: 'MMMM yyyy' },
};

export const AdmissionsChart = memo(function AdmissionsChart({
  data,
  unit,
}: {
  data: Overview['timeline'];
  unit: Overview['unit'];
}) {
  const animate = !useReducedMotion();
  const fmt = DATE_FORMATS[unit];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="fillAdmissions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillCritical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="date"
          {...axisProps}
          tickFormatter={(d: string) => format(parseISO(d), fmt.axis)}
          minTickGap={24}
          tickMargin={8}
        />
        <YAxis {...axisProps} allowDecimals={false} width={48} />
        <Tooltip
          cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
          content={<ChartTooltip labelFormatter={(d) => format(parseISO(d), fmt.tooltip)} />}
        />
        <Area
          isAnimationActive={animate}
          animationDuration={600}
          type="monotone"
          dataKey="admissions"
          name="Admissions"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#fillAdmissions)"
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          isAnimationActive={animate}
          animationDuration={600}
          type="monotone"
          dataKey="critical"
          name="Critical"
          stroke="var(--chart-4)"
          strokeWidth={2}
          fill="url(#fillCritical)"
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const ConditionChart = memo(function ConditionChart({ data }: { data: Overview['conditions'] }) {
  const animate = !useReducedMotion();
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);
  const chartData = useMemo(
    () => data.map((d) => ({ name: CONDITION_META[d.condition].label, value: d.count, fill: CONDITION_META[d.condition].color })),
    [data],
  );

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={animate}
              animationDuration={600}
              data={chartData}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</span>
          <span className="text-xs text-muted">patients</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
            <span className="flex-1 text-muted">{d.name}</span>
            <span className="font-medium tabular-nums">{formatNumber(d.value)}</span>
            <span className="w-11 text-right text-xs text-muted tabular-nums">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export const TopDoctorsChart = memo(function TopDoctorsChart({ data }: { data: Overview['topDoctors'] }) {
  const animate = !useReducedMotion();
  const router = useRouter();
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          {...axisProps}
          width={130}
          tickFormatter={(n: string) => (n.length > 18 ? `${n.slice(0, 17)}…` : n)}
        />
        <Tooltip cursor={{ fill: 'var(--surface-muted)' }} content={<ChartTooltip />} />
        <Bar
          isAnimationActive={animate}
          animationDuration={600}
          dataKey="patients"
          name="Patients"
          fill="var(--chart-1)"
          radius={[0, 6, 6, 0]}
          className="cursor-pointer"
          onClick={(entry) => {
            const id = (entry as unknown as { payload?: { id?: string } }).payload?.id;
            if (id) router.push(`/doctors/${id}`);
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const SpecializationChart = memo(function SpecializationChart({ data }: { data: Overview['specializations'] }) {
  const animate = !useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }} barGap={3}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="specialization"
          {...axisProps}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={70}
          tickFormatter={(s: string) => (s.length > 12 ? `${s.slice(0, 11)}…` : s)}
        />
        <YAxis yAxisId="patients" {...axisProps} allowDecimals={false} width={48} />
        <YAxis yAxisId="doctors" orientation="right" {...axisProps} allowDecimals={false} width={28} />
        <Tooltip cursor={{ fill: 'var(--surface-muted)' }} content={<ChartTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
          formatter={(v: string) => <span className="text-muted">{v}</span>}
        />
        <Bar isAnimationActive={animate} animationDuration={600} yAxisId="patients" dataKey="patients" name="Patients" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar isAnimationActive={animate} animationDuration={600} yAxisId="doctors" dataKey="doctors" name="Doctors" fill="var(--chart-6)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const AgeChart = memo(function AgeChart({ data }: { data: Overview['ageGroups'] }) {
  const animate = !useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="group" {...axisProps} interval={0} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'var(--surface-muted)' }} content={<ChartTooltip />} />
        <Bar isAnimationActive={animate} animationDuration={600} dataKey="count" name="Patients" fill="var(--chart-3)" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const GENDER_COLORS: Record<string, string> = { male: 'var(--chart-1)', female: 'var(--chart-4)', other: 'var(--chart-3)' };

export const GenderSplit = memo(function GenderSplit({ data }: { data: Overview['genders'] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
        {data.map((d) => (
          <div
            key={d.gender}
            style={{ width: `${(d.count / total) * 100}%`, background: GENDER_COLORS[d.gender] }}
            title={`${capitalize(d.gender)}: ${d.count}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {data.map((d) => (
          <span key={d.gender} className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full" style={{ background: GENDER_COLORS[d.gender] }} />
            {capitalize(d.gender)}
            <span className="font-medium text-foreground tabular-nums">{Math.round((d.count / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
});
