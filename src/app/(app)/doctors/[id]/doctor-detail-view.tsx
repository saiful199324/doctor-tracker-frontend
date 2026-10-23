'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CalendarDays, Mail, Pencil, Phone, Plus, Trash2, UserRoundX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DoctorFormModal } from '@/components/doctors/doctor-form-modal';
import { PatientFormModal } from '@/components/patients/patient-form-modal';
import { PatientTable } from '@/components/patients/patient-table';
import { FilterField, FilterPanel } from '@/components/shared/filter-panel';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Select } from '@/components/ui/form';
import { Avatar, Badge, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/misc';
import { Pagination } from '@/components/ui/pagination';
import { useMe } from '@/hooks/use-auth';
import { useDeleteDoctor, useDoctor, useDoctorPatients, useRemovePatientFromDoctor } from '@/hooks/use-doctors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { ApiError, errorMessage } from '@/lib/api';
import { CONDITIONS, type Patient } from '@/lib/types';
import { cn, CONDITION_META, formatDate, formatNumber } from '@/lib/utils';

const DEFAULTS = { page: '1', limit: '10', search: '', condition: '', from: '', to: '', sort: 'newest' };

function ProfileSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
      <Skeleton className="mt-6 h-16" />
    </Card>
  );
}

export function DoctorDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: user } = useMe();
  const isAdmin = user?.role === 'admin';

  const doctorQuery = useDoctor(id);
  const doctor = doctorQuery.data;

  const { filters, setFilters, resetFilters, activeCount } = useUrlFilters(DEFAULTS);
  const params = useMemo(() => ({ ...filters, page: Number(filters.page) || 1, limit: Number(filters.limit) || 10 }), [filters]);
  const patientsQuery = useDoctorPatients(id, params);

  const [editDoctorOpen, setEditDoctorOpen] = useState(false);
  const [deleteDoctorOpen, setDeleteDoctorOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editing, setEditing] = useState<Patient>();
  const [removing, setRemoving] = useState<Patient>();

  const removePatient = useRemovePatientFromDoctor(id);
  const deleteDoctor = useDeleteDoctor();

  const onSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);
  const onPageChange = useCallback((page: number) => setFilters({ page: String(page) }), [setFilters]);
  const onEdit = useCallback((p: Patient) => setEditing(p), []);
  const onDelete = useCallback((p: Patient) => setRemoving(p), []);

  if (doctorQuery.isError) {
    const notFound = doctorQuery.error instanceof ApiError && doctorQuery.error.status === 404;
    return (
      <Card>
        {notFound ? (
          <EmptyState
            icon={<UserRoundX />}
            title="Doctor not found"
            description="This doctor may have been removed."
            action={
              <Link href="/doctors">
                <Button variant="secondary">Back to doctors</Button>
              </Link>
            }
          />
        ) : (
          <ErrorState message={errorMessage(doctorQuery.error)} onRetry={() => doctorQuery.refetch()} />
        )}
      </Card>
    );
  }

  const patients = patientsQuery.data;
  const totalPatients = doctor?.patientCount ?? 0;

  return (
    <>
      <Link
        href="/doctors"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Doctors
      </Link>

      {!doctor ? (
        <ProfileSkeleton />
      ) : (
        <Card className="overflow-hidden">
          <div className="h-20 bg-linear-to-r from-indigo-500/15 via-violet-500/10 to-teal-500/15" />
          <div className="-mt-6 px-5 pb-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Avatar name={doctor.name} className="size-20 rounded-2xl text-xl ring-4 ring-surface" />
                <div className="pb-1">
                  <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{doctor.name}</h1>
                  <Badge className="mt-1 border-primary/20 bg-primary-soft text-primary">{doctor.specialization}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditDoctorOpen(true)}>
                  <Pencil /> Edit
                </Button>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    className="text-danger"
                    onClick={() => setDeleteDoctorOpen(true)}
                    title={totalPatients > 0 ? 'Remove all patients before deleting this doctor' : undefined}
                  >
                    <Trash2 /> Delete
                  </Button>
                )}
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Building2, label: 'Hospital', value: doctor.hospital },
                { icon: Mail, label: 'Email', value: <a href={`mailto:${doctor.email}`} className="hover:text-primary">{doctor.email}</a> },
                { icon: Phone, label: 'Phone', value: <a href={`tel:${doctor.phone}`} className="hover:text-primary">{doctor.phone}</a> },
                { icon: CalendarDays, label: 'Joined', value: formatDate(doctor.createdAt) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="min-w-0 rounded-xl bg-surface-muted/60 p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    {label}
                  </dt>
                  <dd className="mt-1 truncate font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Condition breakdown for this doctor's caseload */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">
                  Caseload · <span className="text-foreground">{formatNumber(totalPatients)} {totalPatients === 1 ? 'patient' : 'patients'}</span>
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
                {CONDITIONS.map((c) => {
                  const count = doctor.byCondition[c] ?? 0;
                  return count > 0 ? (
                    <div
                      key={c}
                      style={{ width: `${(count / totalPatients) * 100}%`, background: CONDITION_META[c].color }}
                      title={`${CONDITION_META[c].label}: ${count}`}
                    />
                  ) : null;
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {CONDITIONS.map((c) => {
                  const active = filters.condition === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setFilters({ condition: active ? '' : c })}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                        active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:text-foreground',
                      )}
                      aria-pressed={active}
                    >
                      <span className="size-2 rounded-full" style={{ background: CONDITION_META[c].color }} />
                      {CONDITION_META[c].label}
                      <span className="font-semibold text-foreground tabular-nums">{doctor.byCondition[c] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8 mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Patients</h2>
          <p className="text-sm text-muted">Patients under this doctor’s care</p>
        </div>
        <Button onClick={() => setAddPatientOpen(true)} disabled={!doctor}>
          <Plus /> <span className="hidden sm:inline">Add patient</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <FilterPanel
          activeCount={activeCount}
          onReset={resetFilters}
          search={<SearchInput value={filters.search} onChange={onSearch} placeholder="Search this doctor’s patients…" />}
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
          <FilterField label="Condition">
            <Select value={filters.condition} onChange={(e) => setFilters({ condition: e.target.value })}>
              <option value="">All conditions</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_META[c].label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Admitted from">
            <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ from: e.target.value })} />
          </FilterField>
          <FilterField label="Admitted to">
            <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ to: e.target.value })} />
          </FilterField>
        </FilterPanel>

        {patientsQuery.isError ? (
          <ErrorState message={errorMessage(patientsQuery.error)} onRetry={() => patientsQuery.refetch()} />
        ) : patients && patients.data.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={activeCount > 0 || filters.search ? 'No patients match your filters' : 'No patients yet'}
            description={
              activeCount > 0 || filters.search ? 'Try adjusting the search or filters.' : 'Add this doctor’s first patient.'
            }
            action={
              activeCount > 0 || filters.search ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setAddPatientOpen(true)}>
                  <Plus /> Add patient
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className={cn('transition-opacity', patientsQuery.isFetching && patients && 'opacity-60')}>
              <PatientTable
                patients={patients?.data ?? []}
                loading={patientsQuery.isLoading}
                showDoctor={false}
                canDelete={isAdmin}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
            {patients && <Pagination meta={patients.meta} onPageChange={onPageChange} isFetching={patientsQuery.isFetching} />}
          </>
        )}
      </Card>

      {doctor && <DoctorFormModal open={editDoctorOpen} onClose={() => setEditDoctorOpen(false)} doctor={doctor} />}
      <PatientFormModal open={addPatientOpen} onClose={() => setAddPatientOpen(false)} doctorId={id} />
      <PatientFormModal open={Boolean(editing)} onClose={() => setEditing(undefined)} patient={editing} />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove patient?"
        description={`${removing?.name ?? 'This patient'} will be permanently removed from ${doctor?.name ?? 'this doctor'}’s patient list.`}
        confirmLabel="Remove patient"
        loading={removePatient.isPending}
        onClose={() => setRemoving(undefined)}
        onConfirm={() =>
          removing &&
          removePatient.mutate(removing._id, {
            onSuccess: () => {
              toast.success(`${removing.name} removed`);
              setRemoving(undefined);
            },
            onError: (err) => toast.error(errorMessage(err)),
          })
        }
      />

      <ConfirmDialog
        open={deleteDoctorOpen}
        title="Delete doctor?"
        description={
          totalPatients > 0
            ? `${doctor?.name} still has ${totalPatients} patient(s). Remove or reassign them before deleting.`
            : `${doctor?.name ?? 'This doctor'} will be permanently deleted. This cannot be undone.`
        }
        confirmLabel="Delete doctor"
        loading={deleteDoctor.isPending}
        onClose={() => setDeleteDoctorOpen(false)}
        onConfirm={() =>
          deleteDoctor.mutate(id, {
            onSuccess: () => {
              toast.success('Doctor deleted');
              router.replace('/doctors');
            },
            onError: (err) => {
              toast.error(errorMessage(err));
              setDeleteDoctorOpen(false);
            },
          })
        }
      />
    </>
  );
}
