'use client';

import { useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { useCreateDoctor, useUpdateDoctor } from '@/hooks/use-doctors';
import { applyServerErrors } from '@/lib/form-errors';
import { SPECIALIZATIONS, type Doctor } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  specialization: z.enum(SPECIALIZATIONS, { errorMap: () => ({ message: 'Select a specialization' }) }),
  hospital: z.string().trim().min(2, 'Hospital is required').max(160),
  phone: z.string().trim().regex(/^\+?[\d\s\-()]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;
const FIELDS = Object.keys(schema.shape);

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided the form edits this doctor, otherwise it creates one. */
  doctor?: Doctor;
}

const empty = { name: '', specialization: '' as FormValues['specialization'], hospital: '', phone: '', email: '' };

export function DoctorFormModal({ open, onClose, doctor }: DoctorFormModalProps) {
  const create = useCreateDoctor();
  const update = useUpdateDoctor(doctor?._id ?? '');
  const mutation = doctor ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  // Layout effect: values are in place before the dialog opens (Modal opens it in a passive effect).
  useLayoutEffect(() => {
    if (open) reset(doctor ? { ...doctor } : empty);
  }, [open, doctor, reset]);

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: (saved) => {
        toast.success(doctor ? 'Doctor updated' : `${saved.name} added`);
        onClose();
      },
      onError: (err) => applyServerErrors(err, setError, FIELDS),
    }),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? 'Edit doctor' : 'Add a new doctor'}
      description={doctor ? 'Update the doctor’s profile details.' : 'Doctors can be assigned patients once created.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" loading={mutation.isPending} disabled={doctor && !isDirty}>
            {doctor ? 'Save changes' : 'Create doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full name" required error={errors.name?.message} className="sm:col-span-2">
          {(a) => <Input {...a} placeholder="Dr. Jane Cooper" autoComplete="off" {...register('name')} />}
        </Field>
        <Field label="Specialization" required error={errors.specialization?.message}>
          {(a) => (
            <Select {...a} {...register('specialization')}>
              <option value="">Select…</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Hospital" required error={errors.hospital?.message}>
          {(a) => <Input {...a} placeholder="City General Hospital" {...register('hospital')} />}
        </Field>
        <Field label="Phone" required error={errors.phone?.message}>
          {(a) => <Input {...a} type="tel" placeholder="+1 555-010-0000" {...register('phone')} />}
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          {(a) => <Input {...a} type="email" placeholder="jane.cooper@hospital.com" {...register('email')} />}
        </Field>
      </form>
    </Modal>
  );
}
