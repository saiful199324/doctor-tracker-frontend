import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <Activity className="size-6" />
      </span>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
    </main>
  );
}
