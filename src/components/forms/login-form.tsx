'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/common/field-wrapper';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@tripmate.app',
      password: 'Tripmate123!'
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Unable to sign in');
      }
      router.push('/trips');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <FieldWrapper label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" {...form.register('email')} />
      </FieldWrapper>
      <FieldWrapper label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
        <Input id="password" type="password" {...form.register('password')} />
      </FieldWrapper>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-xs text-slate-500">Demo login is prefilled so you can review the seeded trip immediately.</p>
    </form>
  );
}
