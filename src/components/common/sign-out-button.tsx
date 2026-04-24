"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut({ callbackUrl: '/' });
      }}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
