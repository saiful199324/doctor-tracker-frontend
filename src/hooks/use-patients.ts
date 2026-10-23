'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Paginated, Patient, PatientInput, PatientListParams } from '@/lib/types';

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: ({ signal }) => api<Paginated<Patient>>('/patients', { params: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}

function useInvalidatePatientData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
      // Doctor pages show patient counts and per-doctor lists.
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
    ]);
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      api<{ data: Patient }>('/patients', { method: 'POST', body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PatientInput> }) =>
      api<{ data: Patient }>(`/patients/${id}`, { method: 'PATCH', body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (id: string) => api(`/patients/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
