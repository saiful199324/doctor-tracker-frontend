'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Mail, Phone, Plus, Stethoscope, Users } from 'lucide-react';
import { DoctorFormModal } from '@/components/doctors/doctor-form-modal';
import { PageHeader } from '@/components/layout/page-header';
import { FilterField, FilterPanel } from '@/components/shared/filter-panel';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Avatar, Badge, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/misc';
import { Pagination } from '@/components/ui/pagination';
import { useDoctorOptions, useDoctors } from '@/hooks/use-doctors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { errorMessage } from '@/lib/api';
import { SPECIALIZATIONS, type Doctor } from '@/lib/types';
import { cn, formatDate, formatNumber } from '@/lib/utils';

const DEFAULTS = {
  page: '1',
  limit: '10',
  search: '',
  specialization: '',
  hospital: '',
  from: '',
  to: '',
  sort: 'newest',
};

function DoctorRow({ doctor }: { doctor: Doctor }) {
  return (
    <Link
      href={`/doctors/${doctor._id}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-4 transition-colors hover:bg-surface-muted/40 sm:px-5 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_7rem_7rem_1.5rem]"
    >
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <Avatar name={doctor.name} className="size-10" />
        <div className="min-w-0">
          <p className="truncate font-medium group-hover:text-primary">{doctor.name}</p>
          <p className="truncate text-xs text-muted">{doctor.specialization}</p>
        </div>
      </div>
      <ChevronRight className="size-4 justify-self-end text-muted md:hidden" />

      <div className="col-span-3 flex min-w-0 items-center gap-1.5 text-sm text-muted md:col-span-1">
        <Building2 className="size-3.5 shrink-0" />
        <span className="truncate">{doctor.hospital}</span>
      </div>
      <div className="col-span-3 hidden min-w-0 space-y-0.5 text-xs text-muted md:col-span-1 md:block">
        <p className="flex items-center gap-1.5 truncate">
          <Mail className="size-3 shrink-0" /> <span className="truncate">{doctor.email}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="size-3 shrink-0" /> {doctor.phone}
        </p>
      </div>
      <div className="col-span-2 flex items-center gap-2 md:col-span-1">
        <Badge className={cn(doctor.patientCount > 0 && 'border-primary/20 bg-primary-soft text-primary')}>
          <Users className="size-3" />
          {formatNumber(doctor.patientCount)}
        </Badge>
      </div>
      <p className="text-right text-xs text-muted md:text-left">{formatDate(doctor.createdAt)}</p>
      <ChevronRight className="hidden size-4 text-muted transition-transform group-hover:translate-x-0.5 md:block" />
    </Link>
  );
}

export function DoctorsView() {
  const { filters, setFilters, resetFilters, activeCount } = useUrlFilters(DEFAULTS);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: options } = useDoctorOptions();

  const params = useMemo(() => ({ ...filters, page: Number(filters.page) || 1, limit: Number(filters.limit) || 10 }), [filters]);
  const { data, isLoading, isError, error, refetch, isFetching } = useDoctors(params);

  const onSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);
  const onPageChange = useCallback(
    (page: number) => {
      setFilters({ page: String(page) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setFilters],
  );
  const onLimitChange = useCallback((limit: number) => setFilters({ limit: String(limit) }), [setFilters]);

  return (
    <>
      <PageHeader
        title="Doctors"
        description={
          data ? `${formatNumber(data.meta.total)} doctor${data.meta.total === 1 ? '' : 's'} found` : 'Manage doctors and their patients'
        }
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Add doctor
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterPanel
          activeCount={activeCount}
          onReset={resetFilters}
          search={
            <SearchInput value={filters.search} onChange={onSearch} placeholder="Search name, hospital, specialty…" />
          }
          sort={
            <Select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} aria-label="Sort doctors">
              <option value="newest">Recently added</option>
              <option value="oldest">Oldest added</option>
              <option value="name">Name A–Z</option>
              <option value="-name">Name Z–A</option>
            </Select>
          }
        >
          <FilterField label="Specialization">
            <Select value={filters.specialization} onChange={(e) => setFilters({ specialization: e.target.value })}>
              <option value="">All specializations</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Hospital">
            <Select value={filters.hospital} onChange={(e) => setFilters({ hospital: e.target.value })}>
              <option value="">All hospitals</option>
              {options?.hospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Joined from">
            <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ from: e.target.value })} />
          </FilterField>
          <FilterField label="Joined to">
            <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ to: e.target.value })} />
          </FilterField>
        </FilterPanel>

        <div className="hidden border-b border-border bg-surface-muted/50 px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_7rem_7rem_1.5rem] md:gap-x-3">
          <span>Doctor</span>
          <span>Hospital</span>
          <span>Contact</span>
          <span>Patients</span>
          <span>Joined</span>
          <span />
        </div>

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
                <Skeleton className="hidden h-3.5 w-40 md:block" />
              </div>
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className={cn('divide-y divide-border transition-opacity', isFetching && 'opacity-60')}>
              {data.data.map((d) => (
                <DoctorRow key={d._id} doctor={d} />
              ))}
            </div>
            <Pagination meta={data.meta} onPageChange={onPageChange} onLimitChange={onLimitChange} isFetching={isFetching} />
          </>
        ) : (
          <EmptyState
            icon={<Stethoscope />}
            title={activeCount > 0 || filters.search ? 'No doctors match your filters' : 'No doctors yet'}
            description={
              activeCount > 0 || filters.search
                ? 'Try a different search term or clear some filters.'
                : 'Add your first doctor to start tracking patients.'
            }
            action={
              activeCount > 0 || filters.search ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus /> Add doctor
                </Button>
              )
            }
          />
        )}
      </Card>

      <DoctorFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
