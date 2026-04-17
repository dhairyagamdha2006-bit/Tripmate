'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

type Props = {
  callbackUrl?: string;
  label?: string;
};

export function GoogleSignInButton({ callbackUrl = '/trips', label = 'Continue with Google' }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signIn('google', { callbackUrl });
      }}
    >
      <span className="flex items-center justify-center gap-2">
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.64 12.27c0-.79-.07-1.55-.2-2.27H12v4.29h6.53a5.58 5.58 0 0 1-2.42 3.66v3h3.91c2.29-2.11 3.62-5.23 3.62-8.68Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.91-3c-1.08.72-2.46 1.15-4.02 1.15-3.09 0-5.7-2.08-6.64-4.89H1.32v3.07A11.99 11.99 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.36 14.35A7.21 7.21 0 0 1 4.96 12c0-.81.14-1.6.4-2.35V6.58H1.32A11.99 11.99 0 0 0 0 12c0 1.93.46 3.76 1.32 5.42l4.04-3.07Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.33.61 4.57 1.81l3.42-3.42C17.95 1.16 15.24 0 12 0A11.99 11.99 0 0 0 1.32 6.58l4.04 3.07C6.3 6.83 8.91 4.75 12 4.75Z"
          />
        </svg>
        {loading ? 'Redirecting…' : label}
      </span>
    </Button>
  );
}
