'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Info } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useLogin } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const DEMO = { email: 'admin@doctortracker.dev', password: 'Admin@12345' };

/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => {
        router.replace(safeNext(searchParams.get('next')));
        router.refresh();
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {login.isError && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {errorMessage(login.error)}
        </div>
      )}

      <Field label="Email" error={errors.email?.message}>
        {(a11y) => (
          <Input {...a11y} type="email" autoComplete="email" placeholder="you@hospital.com" autoFocus {...register('email')} />
        )}
      </Field>

      <Field label="Password" error={errors.password?.message}>
        {(a11y) => (
          <div className="relative">
            <Input
              {...a11y}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>

      <Button type="submit" className="w-full" loading={login.isPending}>
        Sign in
      </Button>

      <div className="flex gap-3 rounded-xl border border-border bg-surface-muted/60 p-3.5 text-xs text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p>
            Demo admin: <span className="font-medium text-foreground">{DEMO.email}</span> /{' '}
            <span className="font-medium text-foreground">{DEMO.password}</span>
          </p>
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setValue('email', DEMO.email, { shouldValidate: true });
              setValue('password', DEMO.password, { shouldValidate: true });
            }}
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </form>
  );
}
