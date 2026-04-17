'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { FieldWrapper } from '@/components/common/field-wrapper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/forms/google-sign-in-button';

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

      // Signup succeeded — establish the Auth.js session.
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password
      });

      if (!signInResult || signInResult.error) {
        // Account exists but sign-in failed — push them to /login so
        // they can retry instead of showing an opaque error.
        router.push('/login');
        return;
      }

      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    }
  });

  return (
    <div className="space-y-5">
      <GoogleSignInButton callbackUrl="/profile" label="Sign up with Google" />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldWrapper label="First name" htmlFor="firstName" error={form.formState.errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
          </FieldWrapper>
          <FieldWrapper label="Last name" htmlFor="lastName" error={form.formState.errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
          </FieldWrapper>
        </div>
        <FieldWrapper label="Email" htmlFor="signupEmail" error={form.formState.errors.email?.message}>
          <Input id="signupEmail" type="email" autoComplete="email" {...form.register('email')} />
        </FieldWrapper>
        <FieldWrapper label="Password" htmlFor="signupPassword" error={form.formState.errors.password?.message} helpText="Use at least 8 characters with upper, lower, number, and symbol.">
          <Input id="signupPassword" type="password" autoComplete="new-password" {...form.register('password')} />
        </FieldWrapper>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
