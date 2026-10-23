'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';
import { Button } from './button';

/** Page numbers with ellipses: 1 … 4 5 6 … 20 */
function pageWindow(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isFetching?: boolean;
}

export const Pagination = memo(function Pagination({ meta, onPageChange, onLimitChange, isFetching }: PaginationProps) {
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-5">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>
          Showing <span className="font-medium text-foreground">{formatNumber(start)}</span>–
          <span className="font-medium text-foreground">{formatNumber(end)}</span> of{' '}
          <span className="font-medium text-foreground">{formatNumber(meta.total)}</span>
        </span>
        {onLimitChange && (
          <label className="hidden items-center gap-1.5 sm:flex">
            <span>Rows</span>
            <select
              value={meta.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-surface px-1.5 text-xs text-foreground"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className={cn('flex items-center gap-1 transition-opacity', isFetching && 'opacity-60')} aria-label="Pagination">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        {pageWindow(meta.page, meta.totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === meta.page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition-colors',
                p === meta.page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:bg-surface-muted hover:text-foreground',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
});
