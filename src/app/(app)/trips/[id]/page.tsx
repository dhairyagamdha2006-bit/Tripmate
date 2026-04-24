import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchTripButton } from '@/components/trip/search-trip-button';
import { PackageCard } from '@/components/trip/package-card';
import { AIChatPanel } from '@/components/trip/ai-chat-panel';
import { SharePanel } from '@/components/trip/share-panel';
import { BookingStatusBadge } from '@/components/trip/booking-status-badge';
import { tripRepository } from '@/server/repositories/trip.repository';
import { mapBooking, mapPackage } from '@/server/mappers/trip.mapper';
import { formatCurrency } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/date';

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const trip = await tripRepository.getTripForUser(params.id, session!.user.id);
  if (!trip) {
    notFound();
  }

  const request = trip.requests[0];
  const booking = trip.bookings[0] ? mapBooking(trip.bookings[0]) : null;
  const packages = request?.packages.map(mapPackage) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">{trip.title}</h1>
            <BookingStatusBadge status={trip.status} />
            {booking ? <BookingStatusBadge status={booking.status} /> : null}
          </div>
          <p className="mt-2 text-slate-300">{trip.originLabel} → {trip.destinationLabel}</p>
          <p className="mt-1 text-sm text-slate-400">{formatDate(trip.departureDate)} – {formatDate(trip.returnDate)} · {trip.travelerCount} traveler{trip.travelerCount === 1 ? '' : 's'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {booking ? <Link href={`/trips/${trip.id}/checkout`}><Button>Open checkout</Button></Link> : <SearchTripButton tripId={trip.id} />}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request snapshot</CardTitle>
              <CardDescription>Structured inputs that power provider search, package scoring, and AI reasoning.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Budget</div>
                <div className="mt-2 text-xl font-semibold text-white">{request ? formatCurrency(request.budgetCents, request.currency) : '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm text-slate-400">Cabin & hotel target</div>
                <div className="mt-2 text-xl font-semibold text-white">{request?.cabinClass?.replaceAll('_', ' ')} · {request?.hotelStarLevel}-star+</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:col-span-2">
                <div className="text-sm text-slate-400">Preferences</div>
                <div className="mt-2 text-sm leading-7 text-slate-200">
                  {request?.preferDirectFlights ? 'Prefer direct flights. ' : ''}
                  {request?.refundableOnly ? 'Refundable-only results requested. ' : ''}
                  {request?.neighborhoodPreference ? `Neighborhood: ${request.neighborhoodPreference}. ` : ''}
                  {request?.amenities?.length ? `Amenities: ${request.amenities.join(', ')}. ` : ''}
                  {request?.notes ? `Notes: ${request.notes}` : 'No extra planning notes yet.'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendation summary</CardTitle>
              <CardDescription>Blends deterministic scoring with provider-aware AI commentary when configured.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{request?.recommendationSummary ?? 'Run a live search to generate recommendation summaries.'}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Packages</h2>
                <p className="mt-1 text-slate-300">Tripmate combines real flight and hotel quotes into honest, selectable itinerary bundles.</p>
              </div>
            </div>
            {packages.length ? packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                tripId={trip.id}
                pkg={pkg}
                activeBookingId={booking?.id}
                selectedPackageId={request?.selectedPackageId ?? null}
              />
            )) : (
              <Card>
                <CardHeader>
                  <CardTitle>No packages yet</CardTitle>
                  <CardDescription>Run a live search against provider APIs to populate packages.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {booking ? (
            <Card>
              <CardHeader>
                <CardTitle>Booking state</CardTitle>
                <CardDescription>Tripmate distinguishes selected quotes, payment status, and actual provider fulfillment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <BookingStatusBadge status={booking.status} />
                  <BookingStatusBadge status={booking.paymentStatus} />
                  <BookingStatusBadge status={booking.fulfillmentStatus} />
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                  <p>Total: <strong className="text-white">{formatCurrency(booking.totalPriceCents, booking.currency)}</strong></p>
                  <p className="mt-2">Provider state: {booking.providerBookingState ?? 'not started'}</p>
                  <p className="mt-2">This itinerary is honest about its state: search, selected, paid, requested, confirmed, or pending manual fulfillment.</p>
                </div>
                <Link href={`/trips/${trip.id}/checkout`}><Button className="w-full">Continue to checkout</Button></Link>
              </CardContent>
            </Card>
          ) : null}

          <SharePanel
            tripId={trip.id}
            shares={trip.shares.map((share) => ({
              id: share.id,
              token: share.token,
              status: share.status,
              createdAt: share.createdAt.toISOString(),
              expiresAt: share.expiresAt?.toISOString() ?? null
            }))}
          />

          <AIChatPanel
            tripId={trip.id}
            enabled={Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)}
            messages={(request?.agentMessages ?? []).map((message) => ({
              id: message.id,
              role: message.role,
              type: message.type,
              content: message.content,
              createdAt: message.createdAt.toISOString()
            }))}
          />
        </div>
      </div>
    </div>
  );
}
