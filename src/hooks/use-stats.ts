'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Overview, StatsRange } from '@/lib/types';

const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

export function useOverview(range: StatsRange) {
  return useQuery<Overview>({
    queryKey: queryKeys.stats.overview(range, timezone),
    queryFn: ({ signal }) =>
      api<{ data: Overview }>('/stats/overview', { params: { range, tz: timezone }, signal }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
