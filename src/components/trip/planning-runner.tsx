'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrustBanner } from '@/components/common/trust-banner';
import type { TripRequestStatus } from '@prisma/client';

export function PlanningRunner({ tripId, status }: { tripId: string; status: TripRequestStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(status === 'RECOMMENDATIONS_READY' || status === 'PENDING_APPROVAL' || status === 'CONFIRMED');

  useEffect(() => {
    if (completed) return;
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/trips/${tripId}/search`, { method: 'POST' });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? 'Unable to generate recommendations.');
        }
        if (!ignore) {
          setCompleted(true);
          router.refresh();
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Unable to generate recommendations.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [completed, router, tripId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Planning progress</h3>
          <p className="mt-1 text-sm text-slate-500">Tripmate searches mock flight and hotel providers, scores bundles, and prepares recommendations.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">✈ Searching flights and fares</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">🏨 Matching hotels and locations</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">📦 Building bundled packages</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">✅ Explaining trade-offs</div>
        </div>
        {loading ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">Generating recommendations…</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
        {completed ? <TrustBanner message="Recommendations are ready. Review every detail before you book." /> : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push(`/trips/${tripId}/recommendations`)} disabled={!completed}>View recommendations</Button>
          <Button variant="secondary" onClick={() => router.push('/trips')}>Back to trips</Button>
        </div>
      </CardContent>
    </Card>
  );
}
