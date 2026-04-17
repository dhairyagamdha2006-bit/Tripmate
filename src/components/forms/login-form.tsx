'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/common/field-wrapper';
import { GoogleSignInButton } from '@/components/forms/google-sign-in-button';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/trips';

  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@tripmate.app',
      password: 'Tripmate123!'
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password
    });

    if (!result || result.error) {
      setError('Invalid email or password.');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  });

  return (
    <div className="space-y-5">
      <GoogleSignInButton callbackUrl={callbackUrl} label="Sign in with Google" />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <form className="space-y-5" onSubmit={onSubmit}>
        <FieldWrapper label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </FieldWrapper>
        <FieldWrapper label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
        </FieldWrapper>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-slate-500">Demo login is prefilled so you can review the seeded trip immediately.</p>
      </form>
    </div>
  );
}
