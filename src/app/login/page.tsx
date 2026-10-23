import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Activity, BarChart3, ShieldCheck, Stethoscope } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

const FEATURES = [
  { icon: Stethoscope, title: 'Doctor & patient records', text: 'Search, filter and manage every record in one place.' },
  { icon: BarChart3, title: 'Live analytics', text: 'Admissions trends, workloads and condition breakdowns.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'httpOnly session cookies and role-based permissions.' },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Activity className="size-5" />
          </span>
          <span className="text-lg font-semibold">Doctor Tracker</span>
        </div>

        <div className="relative my-auto max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            Your clinical operations, at a glance.
          </h1>
          <p className="mt-4 text-indigo-100/90">
            One admin portal for doctors, their patients and the numbers that matter.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-indigo-100/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200/70">© {new Date().getFullYear()} Doctor Tracker</p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white">
              <Activity className="size-5" />
            </span>
            <span className="font-semibold">Doctor Tracker</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to the admin portal to continue.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
