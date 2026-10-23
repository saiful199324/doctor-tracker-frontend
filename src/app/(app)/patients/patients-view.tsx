'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { PatientTable } from '@/components/patients/patient-table';
import { FilterField, FilterPanel } from '@/components/shared/filter-panel';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Select } from '@/components/ui/form';
import { Card, EmptyState, ErrorState } from '@/components/ui/misc';
import { Pagination } from '@/components/ui/pagination';
import { useMe } from '@/hooks/use-auth';
import { useDoctorOptions } from '@/hooks/use-doctors';
import { useDeletePatient, usePatients } from '@/hooks/use-patients';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { errorMessage } from '@/lib/api';
import { CONDITIONS, GENDERS, type Patient } from '@/lib/types';
import { capitalize, cn, CONDITION_META, formatNumber } from '@/lib/utils';

const DEFAULTS = {
  page: '1',
  limit: '10',
  search: '',
  condition: '',
  gender: '',
  doctor: '',
  ageMin: '',
  ageMax: '',
  from: '',
  to: '',
  sort: 'newest',
};

const AGE_PRESETS = [
  { label: 'Any age', min: '', max: '' },
  { label: 'Children (0–17)', min: '0', max: '17' },
  { label: 'Adults (18–64)', min: '18', max: '64' },
  { label: 'Seniors (65+)', min: '65', max: '' },
];

export function PatientsView() {
  const { filters, setFilters, resetFilters, activeCount } = useUrlFilters(DEFAULTS);
  const params = useMemo(() => ({ ...filters, page: Number(filters.page) || 1, limit: Number(filters.limit) || 10 }), [filters]);
  const { data, isLoading, isError, error, refetch, isFetching } = usePatients(params);
  const { data: options } = useDoctorOptions();
  const { data: user } = useMe();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Patient>();
  const [deleting, setDeleting] = useState<Patient>();
  const deletePatient = useDeletePatient();

  const onSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);
  const onPageChange = useCallback(
    (page: number) => {
      setFilters({ page: String(page) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setFilters],
  );
  const onLimitChange = useCallback((limit: number) => setFilters({ limit: String(limit) }), [setFilters]);
  const onEdit = useCallback((p: Patient) => setEditing(p), []);
  const onDelete = useCallback((p: Patient) => setDeleting(p), []);

  const agePreset = AGE_PRESETS.findIndex((p) => p.min === filters.ageMin && p.max === filters.ageMax);

  return (
    <>
      <PageHeader
        title="Patients"
        description={data ? `${formatNumber(data.meta.total)} patient${data.meta.total === 1 ? '' : 's'} found` : 'All patients across every doctor'}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Add patient
          </Button>
        }
      />

      {/* Quick condition filter */}
      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by condition">
        {(['', ...CONDITIONS] as const).map((c) => {
          const active = filters.condition === c;
          return (
            <button
              key={c || 'all'}
              onClick={() => setFilters({ condition: c })}
              aria-pressed={active}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-surface text-muted hover:text-foreground',
              )}
            >
              {c && <span className="size-2 rounded-full" style={{ background: active ? 'currentColor' : CONDITION_META[c].color }} />}
              {c ? CONDITION_META[c].label : 'All patients'}
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <FilterPanel
          activeCount={activeCount - (filters.condition ? 1 : 0)}
          onReset={() => setFilters({ ...DEFAULTS, condition: filters.condition, sort: filters.sort, limit: filters.limit })}
          search={<SearchInput value={filters.search} onChange={onSearch} placeholder="Search name, phone, diagnosis…" />}
          sort={
            <Select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} aria-label="Sort patients">
              <option value="newest">Recently added</option>
              <option value="admitted">Recently admitted</option>
              <option value="oldest">Oldest admission</option>
              <option value="name">Name A–Z</option>
              <option value="age">Youngest first</option>
              <option value="-age">Oldest first</option>
            </Select>
          }
        >
          <FilterField label="Doctor">
            <Select value={filters.doctor} onChange={(e) => setFilters({ doctor: e.target.value })}>
              <option value="">All doctors</option>
              {options?.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Gender">
            <Select value={filters.gender} onChange={(e) => setFilters({ gender: e.target.value })}>
              <option value="">All genders</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {capitalize(g)}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Age group">
            <Select
              value={agePreset === -1 ? 'custom' : String(agePreset)}
              onChange={(e) => {
                const preset = AGE_PRESETS[Number(e.target.value)];
                if (preset) setFilters({ ageMin: preset.min, ageMax: preset.max });
              }}
            >
              {AGE_PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
              {agePreset === -1 && <option value="custom">Custom ({filters.ageMin || 0}–{filters.ageMax || '∞'})</option>}
            </Select>
          </FilterField>
          <div className="grid grid-cols-2 gap-2">
            <FilterField label="Admitted from">
              <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ from: e.target.value })} />
            </FilterField>
            <FilterField label="Admitted to">
              <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ to: e.target.value })} />
            </FilterField>
          </div>
        </FilterPanel>

        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : data && data.data.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No patients match your filters"
            description="Try a different search term or clear some filters."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className={cn('transition-opacity', isFetching && data && 'opacity-60')}>
              <PatientTable
                patients={data?.data ?? []}
                loading={isLoading}
                canDelete={user?.role === 'admin'}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
            {data && <Pagination meta={data.meta} onPageChange={onPageChange} onLimitChange={onLimitChange} isFetching={isFetching} />}
          </>
        )}
      </Card>

      <PatientFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PatientFormModal open={Boolean(editing)} onClose={() => setEditing(undefined)} patient={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete patient?"
        description={`${deleting?.name ?? 'This patient'}’s record will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete patient"
        loading={deletePatient.isPending}
        onClose={() => setDeleting(undefined)}
        onConfirm={() =>
          deleting &&
          deletePatient.mutate(deleting._id, {
            onSuccess: () => {
              toast.success(`${deleting.name} deleted`);
              setDeleting(undefined);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />
    </>
  );
}
