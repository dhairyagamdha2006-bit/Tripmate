import Link from 'next/link';
import { SignupForm } from '@/components/forms/signup-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="auth-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Get started</p>
        <h1 className="font-serif text-4xl text-slate-900">Create your Tripmate account</h1>
        <p className="mt-3 text-sm text-slate-500">Build trips, compare trusted options, and approve bookings only when you are ready.</p>
        <div className="mt-8">
          <SignupForm />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-700 hover:text-blue-800">
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
}
