'use client';

import { useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { useAddPatientToDoctor, useDoctorOptions } from '@/hooks/use-doctors';
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients';
import { applyServerErrors } from '@/lib/form-errors';
import { BLOOD_GROUPS, CONDITIONS, GENDERS, type Patient } from '@/lib/types';
import { capitalize, CONDITION_META, toDateInput, today } from '@/lib/utils';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  age: z.coerce.number({ invalid_type_error: 'Age is required' }).int('Whole years only').min(0, 'Invalid age').max(130, 'Invalid age'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Select a gender' }) }),
  phone: z.string().trim().regex(/^\+?[\d\s\-()]{7,20}$/, 'Enter a valid phone number'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  bloodGroup: z.union([z.literal(''), z.enum(BLOOD_GROUPS)]),
  condition: z.enum(CONDITIONS, { errorMap: () => ({ message: 'Select a condition' }) }),
  diagnosis: z.string().trim().max(500),
  admissionDate: z
    .string()
    .min(1, 'Admission date is required')
    .refine((d) => d <= today(), 'Admission date cannot be in the future'),
  doctor: z.string().min(1, 'Select a doctor'),
});

type FormValues = z.infer<typeof schema>;
const FIELDS = Object.keys(schema.shape);

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Edit mode when provided. */
  patient?: Patient;
  /** Create mode: the patient is added under this doctor (doctor picker hidden). */
  doctorId?: string;
}

const blank = (doctorId = ''): FormValues => ({
  name: '',
  age: '' as unknown as number,
  gender: '' as FormValues['gender'],
  phone: '',
  email: '',
  bloodGroup: '',
  condition: 'observation',
  diagnosis: '',
  admissionDate: today(),
  doctor: doctorId,
});

const fromPatient = (p: Patient): FormValues => ({
  name: p.name,
  age: p.age,
  gender: p.gender,
  phone: p.phone,
  email: p.email ?? '',
  bloodGroup: p.bloodGroup ?? '',
  condition: p.condition,
  diagnosis: p.diagnosis ?? '',
  admissionDate: toDateInput(p.admissionDate),
  doctor: p.doctor?._id ?? '',
});

export function PatientFormModal({ open, onClose, patient, doctorId }: PatientFormModalProps) {
  const isEdit = Boolean(patient);
  // Without a fixed doctor (Patients page) the form shows a doctor picker.
  const showDoctorPicker = isEdit || !doctorId;
  const add = useAddPatientToDoctor(doctorId ?? '');
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const { data: options } = useDoctorOptions();
  const isPending = add.isPending || create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: blank(doctorId) });

  // Layout effect: values are in place before the dialog opens (Modal opens it in a passive effect).
  useLayoutEffect(() => {
    if (open) reset(patient ? fromPatient(patient) : blank(doctorId));
  }, [open, patient, doctorId, reset]);

  const onSubmit = handleSubmit((values) => {
    const onError = (err: unknown) => applyServerErrors(err, setError, FIELDS);

    if (patient) {
      // Send only what changed: smaller payload, no accidental overwrites.
      const changed = Object.fromEntries(
        Object.keys(dirtyFields).map((k) => [k, values[k as keyof FormValues]]),
      ) as Partial<FormValues>;
      update.mutate(
        { id: patient._id, input: changed },
        {
          onSuccess: () => {
            toast.success('Patient updated');
            onClose();
          },
          onError,
        },
      );
      return;
    }

    const onSuccess = (saved: Patient) => {
      toast.success(`${saved.name} added`);
      onClose();
    };
    if (doctorId) {
      // The doctor comes from the URL (/doctors/:id/patients); JSON.stringify drops the undefined key.
      add.mutate({ ...values, doctor: undefined }, { onSuccess, onError });
    } else {
      create.mutate(values, { onSuccess, onError });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit patient' : 'Add patient'}
      description={
        isEdit
          ? 'Update the patient’s record.'
          : doctorId
            ? 'The patient will be assigned to this doctor.'
            : 'Create a patient record and assign a doctor.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" loading={isPending} disabled={isEdit && !isDirty}>
            {isEdit ? 'Save changes' : 'Add patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-6" noValidate>
        <Field label="Full name" required error={errors.name?.message} className="sm:col-span-4">
          {(a) => <Input {...a} placeholder="John Appleseed" autoComplete="off" {...register('name')} />}
        </Field>
        <Field label="Age" required error={errors.age?.message} className="sm:col-span-2">
          {(a) => <Input {...a} type="number" min={0} max={130} inputMode="numeric" {...register('age')} />}
        </Field>

        <Field label="Gender" required error={errors.gender?.message} className="sm:col-span-2">
          {(a) => (
            <Select {...a} {...register('gender')}>
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {capitalize(g)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Blood group" error={errors.bloodGroup?.message} className="sm:col-span-2">
          {(a) => (
            <Select {...a} {...register('bloodGroup')}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Condition" required error={errors.condition?.message} className="sm:col-span-2">
          {(a) => (
            <Select {...a} {...register('condition')}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_META[c].label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Phone" required error={errors.phone?.message} className="sm:col-span-3">
          {(a) => <Input {...a} type="tel" placeholder="+1 555-010-0000" {...register('phone')} />}
        </Field>
        <Field label="Email" error={errors.email?.message} className="sm:col-span-3">
          {(a) => <Input {...a} type="email" placeholder="Optional" {...register('email')} />}
        </Field>

        <Field label="Admission date" required error={errors.admissionDate?.message} className="sm:col-span-3">
          {(a) => <Input {...a} type="date" max={today()} {...register('admissionDate')} />}
        </Field>
        {showDoctorPicker ? (
          <Field label="Assigned doctor" required error={errors.doctor?.message} className="sm:col-span-3">
            {(a) => (
              <Select {...a} {...register('doctor')}>
                <option value="">Select…</option>
                {options?.doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.specialization}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <input type="hidden" {...register('doctor')} />
        )}

        <Field label="Diagnosis / notes" error={errors.diagnosis?.message} className="sm:col-span-6">
          {(a) => <Textarea {...a} rows={3} placeholder="e.g. Type 2 diabetes, follow-up in 2 weeks" {...register('diagnosis')} />}
        </Field>
      </form>
    </Modal>
  );
}
