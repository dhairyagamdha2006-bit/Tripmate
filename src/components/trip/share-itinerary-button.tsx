'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ShareInfo = { url: string; token: string; expiresAt: string | null };

export function ShareItineraryButton({ tripId }: { tripId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createShare() {
    setState('loading');
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Unable to create share link.');
      }
      setShare({ url: data.url, token: data.token, expiresAt: data.expiresAt });
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create share link.');
      setState('error');
    }
  }

  async function copyLink() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable — ignore silently.
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Share this itinerary</p>
          <p className="text-xs text-slate-500">
            Read-only public link. Traveller and payment details are never included.
          </p>
        </div>
        {state !== 'ready' ? (
          <Button onClick={createShare} disabled={state === 'loading'} size="sm">
            {state === 'loading' ? 'Creating…' : 'Create link'}
          </Button>
        ) : null}
      </div>

      {state === 'ready' && share ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            value={share.url}
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
