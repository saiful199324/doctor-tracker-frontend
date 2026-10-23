'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { ConditionBadge } from '@/components/shared/condition-badge';
import { Button } from '@/components/ui/button';
import { Avatar, Skeleton } from '@/components/ui/misc';
import type { Patient } from '@/lib/types';
import { capitalize, formatDate } from '@/lib/utils';

interface PatientTableProps {
  patients: Patient[];
  loading?: boolean;
  showDoctor?: boolean;
  canDelete?: boolean;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
}

const th = 'px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase first:pl-5 last:pr-5';
const td = 'px-4 py-3.5 align-middle first:pl-5 last:pr-5';

function Actions({ patient, canDelete, onEdit, onDelete }: { patient: Patient } & Pick<PatientTableProps, 'canDelete' | 'onEdit' | 'onDelete'>) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(patient)} aria-label={`Edit ${patient.name}`} title="Edit">
          <Pencil />
        </Button>
      )}
      {onDelete && canDelete && (
        <Button
          variant="danger-ghost"
          size="icon-sm"
          onClick={() => onDelete(patient)}
          aria-label={`Delete ${patient.name}`}
          title="Delete"
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}

/** Table on wide screens (the table needs ~1000px next to the sidebar), stacked cards below that. Memoised: only re-renders when its rows change. */
export const PatientTable = memo(function PatientTable({
  patients,
  loading,
  showDoctor = true,
  canDelete,
  onEdit,
  onDelete,
}: PatientTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* `relative` keeps absolutely positioned descendants (the sr-only header) inside this scroller */}
      <div className="relative hidden overflow-x-auto xl:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50">
            <tr>
              <th className={th}>Patient</th>
              <th className={th}>Age / Gender</th>
              <th className={th}>Condition</th>
              <th className={th}>Diagnosis</th>
              {showDoctor && <th className={th}>Doctor</th>}
              <th className={th}>Admitted</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((p) => (
              <tr key={p._id} className="transition-colors hover:bg-surface-muted/40">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted">{p.phone}</p>
                    </div>
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap text-muted`}>
                  <span className="text-foreground">{p.age}</span> · {capitalize(p.gender)}
                  {p.bloodGroup && <span className="ml-1.5 text-xs">({p.bloodGroup})</span>}
                </td>
                <td className={td}>
                  <ConditionBadge condition={p.condition} />
                </td>
                <td className={`${td} max-w-48 truncate text-muted`} title={p.diagnosis}>
                  {p.diagnosis || '—'}
                </td>
                {showDoctor && (
                  <td className={td}>
                    {p.doctor ? (
                      <Link href={`/doctors/${p.doctor._id}`} className="group block min-w-0">
                        <p className="truncate font-medium group-hover:text-primary">{p.doctor.name}</p>
                        <p className="truncate text-xs text-muted">{p.doctor.specialization}</p>
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                )}
                <td className={`${td} whitespace-nowrap text-muted`}>{formatDate(p.admissionDate)}</td>
                <td className={td}>
                  <Actions patient={p} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border xl:hidden">
        {patients.map((p) => (
          <li key={p._id} className="flex gap-3 px-4 py-4">
            <Avatar name={p.name} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted">
                    {p.age} yrs · {capitalize(p.gender)} · {formatDate(p.admissionDate)}
                  </p>
                </div>
                <ConditionBadge condition={p.condition} />
              </div>
              {p.diagnosis && <p className="truncate text-xs text-muted">{p.diagnosis}</p>}
              <div className="flex items-center justify-between gap-2">
                {showDoctor && p.doctor ? (
                  <Link href={`/doctors/${p.doctor._id}`} className="truncate text-xs font-medium text-primary">
                    {p.doctor.name}
                  </Link>
                ) : (
                  <span className="text-xs text-muted">{p.phone}</span>
                )}
                <Actions patient={p} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
});
