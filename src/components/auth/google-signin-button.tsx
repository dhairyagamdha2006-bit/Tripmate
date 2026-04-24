"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function GoogleSignInButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signIn('google', { callbackUrl: '/trips' });
      }}
    >
      {loading ? 'Redirecting...' : label}
    </Button>
  );
}
