'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { User } from '@/lib/types';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => api<{ data: User }>('/auth/me', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api<{ data: User }>('/auth/login', { method: 'POST', body: credentials }).then((r) => r.data),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    // A full navigation discards every cached query and in-memory state in one step
    // (clearing the cache first would make mounted components refetch as 401s).
    onSettled: () => window.location.replace('/login'),
  });
}
