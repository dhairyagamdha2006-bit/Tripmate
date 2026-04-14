'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type State = 'idle' | 'loading' | 'error';

export function ApproveBookingButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (state === 'loading') return;
    setState('loading');
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });
      const payload = await res.json();

      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Booking failed. Please try again.');
      }

      router.push(`/trips/${tripId}/success`);
      router.refresh();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    }
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="w-full"
        onClick={approve}
        disabled={state === 'loading'}
        aria-busy={state === 'loading'}
      >
        {state === 'loading' ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            Processing payment…
          </span>
        ) : (
          'Confirm and book'
        )}
      </Button>

      {state === 'error' && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p className="font-medium">Booking failed</p>
          <p className="mt-0.5 text-red-600">{error}</p>
          <button
            onClick={() => { setState('idle'); setError(null); }}
            className="mt-2 text-xs font-medium text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        By confirming you agree to the cancellation terms above.
      </p>
    </div>
  );
}
