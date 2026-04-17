import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="auth-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Welcome back</p>
        <h1 className="font-serif text-4xl text-slate-900">Sign in to Tripmate</h1>
        <p className="mt-3 text-sm text-slate-500">Review your trips, saved traveler profile, and booking details.</p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Need an account?{' '}
          <Link href="/signup" className="font-medium text-blue-700 hover:text-blue-800">
            Create one here.
          </Link>
        </p>
      </div>
    </div>
  );
}
