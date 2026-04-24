import Link from 'next/link';
import { auth } from '@/auth';
import { tripRepository } from '@/server/repositories/trip.repository';
import { mapTripCard } from '@/server/mappers/trip.mapper';
import { formatCurrency } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingStatusBadge } from '@/components/trip/booking-status-badge';

export default async function TripsPage() {
  const session = await auth();
  const trips = await tripRepository.listTripsForUser(session!.user.id);
  const cards = trips.map(mapTripCard);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Your trips</h1>
          <p className="mt-2 text-slate-300">Track live search sessions, payment state, reminders, and share links.</p>
        </div>
        <Link href="/trips/new">
          <Button>Create a new trip</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.length ? cards.map((trip) => (
          <Link key={trip.id} href={`/trips/${trip.id}`}>
            <Card className="h-full transition hover:border-sky-400/40">
              <CardHeader>
                <CardTitle>{trip.title}</CardTitle>
                <CardDescription>{trip.originLabel} → {trip.destinationLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <BookingStatusBadge status={trip.status} />
                  {trip.bookingStatus ? <BookingStatusBadge status={trip.bookingStatus} /> : null}
                </div>
                <div className="text-sm text-slate-300">
                  {formatDate(trip.departureDate)} – {formatDate(trip.returnDate)} · {trip.travelerCount} traveler{trip.travelerCount === 1 ? '' : 's'}
                </div>
                <div className="text-lg font-semibold text-white">
                  {typeof trip.totalPriceCents === 'number' ? formatCurrency(trip.totalPriceCents) : 'No package selected yet'}
                </div>
              </CardContent>
            </Card>
          </Link>
        )) : (
          <Card>
            <CardHeader>
              <CardTitle>No trips yet</CardTitle>
              <CardDescription>Create your first provider-backed itinerary request to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/trips/new"><Button>Create trip</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
