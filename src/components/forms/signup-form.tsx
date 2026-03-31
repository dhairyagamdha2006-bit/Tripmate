'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { FieldWrapper } from '@/components/common/field-wrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Unable to create account');
      }
      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrapper label="First name" htmlFor="firstName" error={form.formState.errors.firstName?.message}>
          <Input id="firstName" {...form.register('firstName')} />
        </FieldWrapper>
        <FieldWrapper label="Last name" htmlFor="lastName" error={form.formState.errors.lastName?.message}>
          <Input id="lastName" {...form.register('lastName')} />
        </FieldWrapper>
      </div>
      <FieldWrapper label="Email" htmlFor="signupEmail" error={form.formState.errors.email?.message}>
        <Input id="signupEmail" type="email" {...form.register('email')} />
      </FieldWrapper>
      <FieldWrapper label="Password" htmlFor="signupPassword" error={form.formState.errors.password?.message} helpText="Use at least 8 characters with upper, lower, number, and symbol.">
        <Input id="signupPassword" type="password" {...form.register('password')} />
      </FieldWrapper>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
