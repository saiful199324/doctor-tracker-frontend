'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Typing updates local state only; the parent (and so the URL + API request) hears about it
 * once the user pauses. That avoids a request and a router update per keystroke.
 */
export const SearchInput = memo(function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, 350);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync when the URL changes from outside (back button, "clear filters").
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (debounced.trim() !== value) onChangeRef.current(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Search'}
        className="h-10 w-full rounded-xl border border-border bg-surface pr-9 pl-9 text-sm shadow-xs transition-colors placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onChange('');
          }}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
});
