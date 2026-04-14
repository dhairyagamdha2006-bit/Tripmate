'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrustBanner } from '@/components/common/trust-banner';
import type { TripRequestStatus } from '@prisma/client';

const DONE_STATUSES: TripRequestStatus[] = [
  'RECOMMENDATIONS_READY',
  'PACKAGE_SELECTED',
  'PENDING_APPROVAL',
  'BOOKING_PENDING',
  'CONFIRMED'
];
const MAX_WAIT_MS = 90_000; // 90 second timeout

const steps = [
  { icon: '✈', label: 'Searching flights and fares' },
  { icon: '🏨', label: 'Matching hotels and locations' },
  { icon: '📦', label: 'Building bundled packages' },
  { icon: '✅', label: 'Scoring trade-offs for you' }
];

export function PlanningRunner({
  tripId,
  status
}: {
  tripId: string;
  status: TripRequestStatus;
}) {
  const router = useRouter();
  const isDone = DONE_STATUSES.includes(status);
  const [completed, setCompleted] = useState(isDone);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (completed) return;
    let ignore = false;
    startedAt.current = Date.now();

    // Animate through steps while loading
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/trips/${tripId}/search`, { method: 'POST' });
        const payload = await res.json();

        if (!res.ok || !payload.ok) {
          throw new Error(payload.error ?? 'Unable to generate recommendations.');
        }

        if (!ignore) {
          setCompleted(true);
          setActiveStep(steps.length - 1);
          router.refresh();
        }
      } catch (err) {
        if (!ignore) {
          const elapsed = Date.now() - (startedAt.current ?? 0);
          if (elapsed >= MAX_WAIT_MS) {
            setTimedOut(true);
          } else {
            setError(err instanceof Error ? err.message : 'Unable to generate recommendations.');
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
      clearInterval(stepInterval);
    };
  }, [completed, router, tripId]);

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {completed ? 'Planning complete' : 'Finding the best options for you…'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tripmate searches flights and hotels, scores bundles, and prepares personalised recommendations.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className={`rounded-2xl border px-4 py-3 text-sm transition-colors duration-300 ${
                completed || i < activeStep
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : i === activeStep && loading
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <span className="mr-2">{step.icon}</span>
              {step.label}
              {(completed || i < activeStep) && (
                <span className="ml-2 text-teal-500">✓</span>
              )}
            </div>
          ))}
        </div>

        {loading && !error && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Generating recommendations…
          </div>
        )}

        {timedOut && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <p className="font-medium">This is taking longer than expected.</p>
            <p className="mt-0.5">Try refreshing the page — your recommendations may already be ready.</p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-0.5 text-red-600">{error}</p>
            <button
              className="mt-2 text-xs font-medium underline hover:no-underline"
              onClick={() => { setError(null); setCompleted(false); }}
            >
              Try again
            </button>
          </div>
        )}

        {completed && (
          <TrustBanner message="Recommendations are ready. Review every detail before you book." />
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push(`/trips/${tripId}/recommendations`)}
            disabled={!completed}
          >
            View recommendations
          </Button>
          <Button variant="secondary" onClick={() => router.push('/trips')}>
            Back to trips
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
