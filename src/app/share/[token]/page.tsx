import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/common/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from '@/components/trip/booking-status-badge';
import { formatCurrency } from '@/lib/utils/money';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { shareService } from '@/server/services/share.service';

export default async function PublicSharePage({ params }: { params: { token: string } }) {
  const share = await shareService.getPublicShare(params.token);
  if (!share) {
    notFound();
  }

  const request = share.trip.requests[0];
  const booking = share.trip.bookings[0];
  const packages = request?.packages ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/"><Button variant="outline">Open Tripmate</Button></Link>
      </header>

      <div className="mt-10 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold text-white">{share.trip.title}</h1>
            {booking ? <BookingStatusBadge status={booking.status} /> : null}
          </div>
          <p className="mt-2 text-slate-300">{share.trip.originLabel} → {share.trip.destinationLabel}</p>
          <p className="mt-1 text-sm text-slate-400">{formatDate(share.trip.departureDate)} – {formatDate(share.trip.returnDate)} · {share.trip.travelerCount} traveler{share.trip.travelerCount === 1 ? '' : 's'}</p>
        </div>

        {share.note ? (
          <Card>
            <CardHeader>
              <CardTitle>Shared note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-slate-200">{share.note}</p>
            </CardContent>
          </Card>
        ) : null}

        {booking ? (
          <Card>
            <CardHeader>
              <CardTitle>Current booking state</CardTitle>
              <CardDescription>Shared itineraries expose itinerary essentials only. Account, payment, and profile details remain private.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="flex flex-wrap gap-3">
                <BookingStatusBadge status={booking.status} />
                <BookingStatusBadge status={booking.paymentStatus} />
                <BookingStatusBadge status={booking.fulfillmentStatus} />
              </div>
              <p>Total: <strong className="text-white">{formatCurrency(booking.totalPriceCents, booking.currency)}</strong></p>
              {booking.cancellationDeadline ? <p>Cancellation deadline: {formatDateTime(booking.cancellationDeadline)}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle>{pkg.label.replaceAll('_', ' ')} · {formatCurrency(pkg.totalPriceCents, pkg.currency)}</CardTitle>
                <CardDescription>{pkg.explanation}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                  <h3 className="mb-2 font-medium text-white">Flight</h3>
                  <p>{pkg.flightOption.airline} {pkg.flightOption.flightNumber}</p>
                  <p>{pkg.flightOption.originCode} → {pkg.flightOption.destinationCode}</p>
                  <p>{formatDateTime(pkg.flightOption.departureTime)} → {formatDateTime(pkg.flightOption.arrivalTime)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                  <h3 className="mb-2 font-medium text-white">Hotel</h3>
                  <p>{pkg.hotelOption.name}</p>
                  <p>{pkg.hotelOption.stars}-star · {pkg.hotelOption.city}</p>
                  <p>{pkg.hotelOption.roomType ?? 'Room details unavailable'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
