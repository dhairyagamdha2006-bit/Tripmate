"use client";

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from './google-signin-button';

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your Tripmate account</CardTitle>
        <CardDescription>Use email and password or continue with Google.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {googleEnabled ? (
          <>
            <GoogleSignInButton label="Continue with Google" />
            <div className="text-center text-xs uppercase tracking-[0.24em] text-slate-500">or</div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Google sign-in will appear automatically once AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are configured.</p>
        )}
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);

            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = (await response.json()) as { ok: boolean; error?: string };

            if (!response.ok || !data.ok) {
              setLoading(false);
              setError(data.error ?? 'Failed to create account.');
              return;
            }

            const result = await signIn('credentials', {
              email,
              password,
              redirect: false,
              callbackUrl: '/trips'
            });

            setLoading(false);
            window.location.href = result?.url ?? '/trips';
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-300 hover:text-sky-200">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
