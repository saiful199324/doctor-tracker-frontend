import type { DoctorListParams, PatientListParams, StatsRange } from './types';

/** Hierarchical query keys: invalidating `['doctors']` refreshes every doctor query. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  doctors: {
    all: ['doctors'] as const,
    list: (params: DoctorListParams) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    patients: (id: string, params: PatientListParams) => ['doctors', 'detail', id, 'patients', params] as const,
    options: ['doctors', 'options'] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (params: PatientListParams) => ['patients', 'list', params] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: (range: StatsRange, tz: string) => ['stats', 'overview', range, tz] as const,
  },
};
