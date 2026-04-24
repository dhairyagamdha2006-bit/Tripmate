"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/money';
import type { PackageView } from '@/types/travel';
import { BookingStatusBadge } from './booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PackageCard({
  tripId,
  pkg,
  activeBookingId,
  selectedPackageId
}: {
  tripId: string;
  pkg: PackageView;
  activeBookingId?: string | null;
  selectedPackageId?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelected = selectedPackageId === pkg.id;

  return (
    <Card className={isSelected ? 'border-sky-400/40 shadow-sky-950/40' : undefined}>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={pkg.recommended ? 'success' : 'info'}>{pkg.label.replaceAll('_', ' ')}</Badge>
          <div className="text-sm text-slate-300">Score {pkg.score.overall}/100</div>
          {isSelected && activeBookingId ? <BookingStatusBadge status="selected" /> : null}
        </div>
        <CardTitle>{formatCurrency(pkg.totalPriceCents, pkg.currency)}</CardTitle>
        <CardDescription>{pkg.explanation}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="font-medium text-white">Flight</h4>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>{pkg.flight.airline} {pkg.flight.flightNumber}</p>
              <p>{pkg.flight.originCode} → {pkg.flight.destinationCode}</p>
              <p>{formatDateTime(pkg.flight.departureTime)} → {formatDateTime(pkg.flight.arrivalTime)}</p>
              <p>{pkg.flight.stops === 0 ? 'Nonstop' : `${pkg.flight.stops} stop(s)`}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="font-medium text-white">Hotel</h4>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>{pkg.hotel.name}</p>
              <p>{pkg.hotel.stars}-star · {pkg.hotel.city}</p>
              <p>{pkg.hotel.roomType ?? 'Standard room details unavailable'}</p>
              <p>{pkg.hotel.refundable ? 'Refundable rate' : 'Limited refund flexibility'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h5 className="mb-2 text-sm font-semibold text-white">Highlights</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              {pkg.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="mb-2 text-sm font-semibold text-white">Watchouts</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              {pkg.warnings.length ? pkg.warnings.map((item) => <li key={item}>• {item}</li>) : <li>• No major warnings surfaced in the current quote set.</li>}
            </ul>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          {activeBookingId && isSelected ? (
            <Link href={`/trips/${tripId}/checkout`}>
              <Button>Continue to payment</Button>
            </Link>
          ) : (
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/trips/${tripId}/select-package`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ packageId: pkg.id })
                });
                const data = (await response.json()) as { ok: boolean; error?: string };
                setLoading(false);
                if (!response.ok || !data.ok) {
                  setError(data.error ?? 'Failed to select package.');
                  return;
                }
                router.push(`/trips/${tripId}/checkout`);
                router.refresh();
              }}
            >
              {loading ? 'Selecting...' : 'Select this package'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
