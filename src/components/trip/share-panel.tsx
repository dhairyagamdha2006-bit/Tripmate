"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SharePanel({
  tripId,
  shares
}: {
  tripId: string;
  shares: Array<{ id: string; token: string; status: string; createdAt: string; url?: string; expiresAt?: string | null }>;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedShareId, setSelectedShareId] = useState<string | null>(shares[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share itinerary</CardTitle>
        <CardDescription>Generate public itinerary links with scoped public access. Private account and payment data stay hidden.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <Label htmlFor="share-note">Optional note saved with the link</Label>
          <Input id="share-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Shared with family for feedback" />
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError(null);
              const response = await fetch(`/api/trips/${tripId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', note })
              });
              const data = (await response.json()) as { ok: boolean; error?: string; share?: { id: string } };
              setLoading(false);
              if (!response.ok || !data.ok) {
                setError(data.error ?? 'Failed to create share link.');
                return;
              }
              setSelectedShareId(data.share?.id ?? null);
              router.refresh();
            }}
          >
            {loading ? 'Creating link...' : 'Create share link'}
          </Button>
        </div>

        <div className="space-y-3">
          {shares.length ? (
            shares.map((share) => {
              const url = `/share/${share.token}`;
              return (
                <div key={share.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{share.status.toLowerCase().replaceAll('_', ' ')}</div>
                      <div className="mt-1 break-all text-sm text-slate-400">{url}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${url}`)}>
                        Copy
                      </Button>
                      {share.status === 'ACTIVE' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await fetch(`/api/trips/${tripId}/share`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'revoke', shareId: share.id })
                            });
                            router.refresh();
                          }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-400">No share links created yet.</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <h4 className="font-medium text-white">Email an itinerary link</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Recipient name" />
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="recipient@example.com" type="email" />
          </div>
          <select
            value={selectedShareId ?? ''}
            onChange={(event) => setSelectedShareId(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-white"
          >
            <option value="">Select a share link</option>
            {shares.filter((share) => share.status === 'ACTIVE').map((share) => (
              <option key={share.id} value={share.id}>
                {share.token}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !selectedShareId || !email || !recipientName}
            onClick={async () => {
              setLoading(true);
              setError(null);
              const response = await fetch(`/api/trips/${tripId}/share/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shareId: selectedShareId, email, recipientName })
              });
              const data = (await response.json()) as { ok: boolean; error?: string };
              setLoading(false);
              if (!response.ok || !data.ok) {
                setError(data.error ?? 'Failed to send share email.');
                return;
              }
              setEmail('');
              setRecipientName('');
            }}
          >
            Email itinerary link
          </Button>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
