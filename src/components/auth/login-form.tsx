"use client";

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from './google-signin-button';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in with email and password or continue with Google.</CardDescription>
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

            const result = await signIn('credentials', {
              email,
              password,
              redirect: false,
              callbackUrl: '/trips'
            });

            setLoading(false);

            if (!result || result.error) {
              setError('Invalid email or password.');
              return;
            }

            window.location.href = result.url ?? '/trips';
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-sm text-slate-400">
          Need an account?{' '}
          <Link href="/signup" className="text-sky-300 hover:text-sky-200">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
