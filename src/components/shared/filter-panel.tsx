'use client';

import { useState, type ReactNode } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  search: ReactNode;
  sort?: ReactNode;
  activeCount: number;
  onReset: () => void;
  children: ReactNode;
}

/** Search + sort always visible; secondary filters collapse behind a toggle (open by default on desktop). */
export function FilterPanel({ search, sort, activeCount, onReset, children }: FilterPanelProps) {
  const [open, setOpen] = useState(activeCount > 0);

  return (
    <div className="space-y-3 border-b border-border p-4 sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">{search}</div>
        <div className="flex gap-2">
          {sort && <div className="flex-1 sm:w-44 sm:flex-none">{sort}</div>}
          <Button
            variant="secondary"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(open && 'border-primary/40 bg-primary-soft text-primary hover:bg-primary-soft')}
          >
            <SlidersHorizontal />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div className="grid animate-fade-in grid-cols-1 gap-3 rounded-xl bg-surface-muted/60 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {children}
          {activeCount > 0 && (
            <div className="flex items-end sm:col-span-2 lg:col-span-4 lg:justify-end">
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw />
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
