'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SelectPackageButton({ tripId, packageId, label = 'Select package' }: { tripId: string; packageId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectPackage() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/trips/${tripId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Could not select package.');
      }
      router.push(`/trips/${tripId}/booking-review`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not select package.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={selectPackage} disabled={loading}>{loading ? 'Selecting…' : label}</Button>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
