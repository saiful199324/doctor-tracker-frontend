'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/misc';

/** Catches unexpected render errors inside the app shell, so the sidebar stays usable. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-base font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">
        This page hit an unexpected error. Your data is safe. Try again, or pick another page from the menu.
      </p>
      <Button className="mt-6" onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </Card>
  );
}
