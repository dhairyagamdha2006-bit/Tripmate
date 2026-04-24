"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SearchTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const response = await fetch(`/api/trips/${tripId}/search`, { method: 'POST' });
          const data = (await response.json()) as { ok: boolean; error?: string };
          setLoading(false);
          if (!response.ok || !data.ok) {
            setError(data.error ?? 'Search failed.');
            return;
          }
          router.refresh();
        }}
      >
        {loading ? 'Searching live providers...' : 'Search live travel offers'}
      </Button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
