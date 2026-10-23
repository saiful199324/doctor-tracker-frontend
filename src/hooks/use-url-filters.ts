'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Keeps list filters in the URL query string, which makes them the single source of truth:
 * shareable/bookmarkable views, working back/forward buttons and state that survives a refresh.
 * `defaults` declares the known keys; anything equal to its default is omitted from the URL.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Recomputed only when the query string changes, so consumers get a stable object.
  const queryString = searchParams.toString();
  const filters = useMemo(() => {
    const params = new URLSearchParams(queryString);
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const value = params.get(key as string);
      if (value !== null) result[key] = value as T[keyof T];
    }
    return result;
    // `defaults` is expected to be a module-level constant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || value === defaults[key]) params.delete(key);
        else params.set(key, value);
      }
      // Any filter change other than paging resets to the first page.
      if (!('page' in updates)) params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [defaults, pathname, router],
  );

  const resetFilters = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const activeCount = useMemo(
    () =>
      (Object.keys(defaults) as Array<keyof T>).filter(
        (k) => !['page', 'limit', 'sort'].includes(k as string) && filters[k] !== defaults[k],
      ).length,
    [defaults, filters],
  );

  return { filters, setFilters, resetFilters, activeCount };
}
