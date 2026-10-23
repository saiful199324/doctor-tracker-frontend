'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, HeartPulse, Stethoscope, Users } from 'lucide-react';
import { AdmissionsChart, AgeChart, ConditionChart, GenderSplit, SpecializationChart, TopDoctorsChart } from '@/components/dashboard/charts';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { ConditionBadge } from '@/components/shared/condition-badge';
import { Avatar, Card, CardHeader, ErrorState, Skeleton } from '@/components/ui/misc';
import { useMe } from '@/hooks/use-auth';
import { useOverview } from '@/hooks/use-stats';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { errorMessage } from '@/lib/api';
import type { Overview, StatsRange } from '@/lib/types';
import { cn, formatNumber, timeAgo } from '@/lib/utils';

const RANGES: Array<{ value: StatsRange; label: string; long: string }> = [
  { value: '7d', label: '7D', long: 'last 7 days' },
  { value: '30d', label: '30D', long: 'last 30 days' },
  { value: '90d', label: '90D', long: 'last 90 days' },
  { value: '12m', label: '12M', long: 'last 12 months' },
];

const DEFAULTS = { range: '30d' };

/**
 * Memoised on the `totals` object: it keeps its identity while the next range loads
 * (keepPreviousData), so the cards render once per new result, not on every fetch-state change.
 */
const KpiRow = memo(function KpiRow({ totals, rangeLabel }: { totals: Overview['totals']; rangeLabel: string }) {
  const criticalShare = totals.patients ? ((totals.criticalPatients / totals.patients) * 100).toFixed(1) : '0';
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total doctors"
        value={formatNumber(totals.doctors)}
        icon={<Stethoscope />}
        accent="var(--chart-1)"
        hint={<span>+{totals.newDoctorsInRange} joined in the {rangeLabel}</span>}
      />
      <StatCard
        label="Total patients"
        value={formatNumber(totals.patients)}
        icon={<Users />}
        accent="var(--chart-2)"
        hint={<span>{totals.avgPatientsPerDoctor} patients per doctor on average</span>}
      />
      <StatCard
        label="Admissions"
        value={formatNumber(totals.admissionsInRange)}
        icon={<Activity />}
        accent="var(--chart-6)"
        trend={totals.admissionsTrend}
        hint={<span>vs previous period</span>}
      />
      <StatCard
        label="Critical patients"
        value={formatNumber(totals.criticalPatients)}
        icon={<HeartPulse />}
        accent="var(--chart-4)"
        hint={<span>{criticalShare}% of all patients</span>}
      />
    </div>
  );
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function DashboardView() {
  const { filters, setFilters } = useUrlFilters(DEFAULTS);
  const range = (RANGES.some((r) => r.value === filters.range) ? filters.range : '30d') as StatsRange;
  const rangeLabel = RANGES.find((r) => r.value === range)!.long;
  const { data, isLoading, isError, error, refetch, isFetching } = useOverview(range);
  const { data: user } = useMe();

  return (
    <>
      <PageHeader
        title={user ? `${greeting()}, ${user.name.split(' ')[0]}` : 'Dashboard'}
        description="Here's what's happening across your doctors and patients."
        actions={
          <div className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-xs" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.value}
                role="tab"
                aria-selected={range === r.value}
                onClick={() => setFilters({ range: r.value })}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  range === r.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isError ? (
        <Card>
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className={cn('space-y-6 transition-opacity', isFetching && !isLoading && 'opacity-70')}>
          {/* KPI row */}
          {isLoading || !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            // Label comes from the data's own range, so cards never pair new wording with old numbers.
            <KpiRow totals={data.totals} rangeLabel={RANGES.find((r) => r.value === data.range)!.long} />
          )}

          {/* Admissions trend + condition breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Patient admissions"
                description={`New admissions and critical cases, ${rangeLabel}`}
                action={
                  <div className="flex gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[var(--chart-1)]" /> Admissions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[var(--chart-4)]" /> Critical
                    </span>
                  </div>
                }
              />
              <div className="px-2 pt-4 pb-3 sm:px-4">
                {data ? <AdmissionsChart data={data.timeline} unit={data.unit} /> : <Skeleton className="mx-3 h-[280px]" />}
              </div>
            </Card>

            <Card>
              <CardHeader title="Patient conditions" description="Current status across all patients" />
              <div className="p-5">{data ? <ConditionChart data={data.conditions} /> : <Skeleton className="h-48" />}</div>
            </Card>
          </div>

          {/* Patients per doctor + specialization */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Patients per doctor"
                description="Doctors with the largest caseload. Click a bar to open the doctor."
                action={
                  <Link href="/doctors?sort=newest" className="text-xs font-medium text-primary hover:underline">
                    All doctors
                  </Link>
                }
              />
              <div className="px-2 pt-4 pb-3 sm:px-4">
                {data ? <TopDoctorsChart data={data.topDoctors} /> : <Skeleton className="mx-3 h-[300px]" />}
              </div>
            </Card>

            <Card>
              <CardHeader title="By specialization" description="Patients (left axis) and doctors (right axis)" />
              <div className="px-2 pt-2 pb-3 sm:px-4">
                {data ? <SpecializationChart data={data.specializations} /> : <Skeleton className="mx-3 h-[300px]" />}
              </div>
            </Card>
          </div>

          {/* Demographics + recent admissions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Demographics" description="Age distribution and gender split" />
              <div className="space-y-6 p-5">
                {data ? (
                  <>
                    <AgeChart data={data.ageGroups} />
                    <GenderSplit data={data.genders} />
                  </>
                ) : (
                  <Skeleton className="h-60" />
                )}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Recently added patients"
                description="Newest patient records"
                action={
                  <Link href="/patients" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    View all <ArrowRight className="size-3" />
                  </Link>
                }
              />
              <ul className="divide-y divide-border px-5 pt-2 pb-2">
                {data
                  ? data.recentPatients.map((p) => (
                      <li key={p._id} className="flex items-center gap-3 py-3">
                        <Avatar name={p.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted">
                            {p.age} yrs · {p.doctor ? p.doctor.name : 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <ConditionBadge condition={p.condition} />
                          <span className="text-[11px] text-muted">{timeAgo(p.createdAt)}</span>
                        </div>
                      </li>
                    ))
                  : Array.from({ length: 5 }, (_, i) => (
                      <li key={i} className="flex items-center gap-3 py-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </li>
                    ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
