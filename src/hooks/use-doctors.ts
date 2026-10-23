'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  Doctor,
  DoctorDetail,
  DoctorInput,
  DoctorListParams,
  DoctorOptions,
  Paginated,
  Patient,
  PatientInput,
  PatientListParams,
} from '@/lib/types';

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: ({ signal }) => api<Paginated<Doctor>>('/doctors', { params: { ...params }, signal }),
    // Keep the current page on screen while the next one loads: no layout jump, no spinner flash.
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: ({ signal }) => api<{ data: DoctorDetail }>(`/doctors/${id}`, { signal }).then((r) => r.data),
  });
}

export function useDoctorPatients(id: string, params: PatientListParams) {
  return useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: ({ signal }) => api<Paginated<Patient>>(`/doctors/${id}/patients`, { params: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useDoctorOptions() {
  return useQuery({
    queryKey: queryKeys.doctors.options,
    queryFn: ({ signal }) => api<{ data: DoctorOptions }>('/doctors/options', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

/** Doctor and patient writes affect lists, counts and dashboard stats; refresh them all. */
function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: DoctorInput) =>
      api<{ data: Doctor }>('/doctors', { method: 'POST', body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateDoctor(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: Partial<DoctorInput>) =>
      api<{ data: Doctor }>(`/doctors/${id}`, { method: 'PATCH', body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      // Skip the deleted doctor's own queries: refetching them would only return 404.
      const deletedDetail = queryKeys.doctors.detail(id);
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.doctors.all,
          predicate: (q) => !deletedDetail.every((part, i) => q.queryKey[i] === part),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
      ]);
    },
  });
}

export function useAddPatientToDoctor(doctorId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      api<{ data: Patient }>(`/doctors/${doctorId}/patients`, { method: 'POST', body: input }).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useRemovePatientFromDoctor(doctorId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (patientId: string) => api(`/doctors/${doctorId}/patients/${patientId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
