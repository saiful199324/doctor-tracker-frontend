'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, LogOut, Menu, Stethoscope, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, Skeleton } from '@/components/ui/misc';
import { useLogout, useMe } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/patients', label: 'Patients', icon: Users },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
        <Activity className="size-5" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Doctor Tracker</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Main">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-muted hover:text-foreground',
            )}
          >
            <Icon className={cn('size-[18px]', active ? 'text-primary' : 'text-muted group-hover:text-foreground')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/50 p-2.5">
      {isLoading || !user ? (
        <>
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </>
      ) : (
        <>
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted capitalize">{user.role}</p>
          </div>
        </>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => logout.mutate()}
        loading={logout.isPending}
        aria-label="Sign out"
        title="Sign out"
      >
        {!logout.isPending && <LogOut />}
      </Button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-1 pt-1">
        <Brand />
        <ThemeToggle />
      </div>
      <div>
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">Menu</p>
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="mt-auto">
        <UserCard />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    // The background paints the sidebar column for the full document height (long pages, print, full-page captures).
    <div className="min-h-dvh lg:bg-[linear-gradient(to_right,var(--surface)_16rem,var(--border)_16rem,var(--border)_calc(16rem+1px),transparent_calc(16rem+1px))]">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-slate-950/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in-left border-r border-border bg-surface shadow-2xl">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 -right-11 bg-surface"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X />
            </Button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main id="main" tabIndex={-1} className="outline-none lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
