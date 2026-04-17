import { notFound } from 'next/navigation';
import { ConfirmationCard } from '@/components/booking/confirmation-card';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { LinkButton } from '@/components/ui/link-button';
import { ShareItineraryButton } from '@/components/trip/share-itinerary-button';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';
import { formatDate } from '@/lib/utils/date';

export default async function BookingSuccessPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();

  const request = trip.requests[0];
  if (!request) notFound();

  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });
  if (!detail.booking) notFound();

  const selected = detail.packages.find((p) => p.id === detail.selectedPackageId);
  const isRefundable = selected?.flight.refundable && selected?.hotel.refundable;
  const cancellationDeadline = selected?.hotel.cancellationDeadline
    ? formatDate(selected.hotel.cancellationDeadline)
    : null;

  const pendingFulfilment = detail.booking.status === 'PENDING_FULFILLMENT';
  const headline = pendingFulfilment
    ? 'Payment authorised · finalising with suppliers'
    : 'Your trip is confirmed';
  const subline = pendingFulfilment
    ? "We've authorised your card and are issuing the reservation. You'll get a confirmation email once everything is finalised."
    : 'A confirmation email has been sent to your inbox.';

  return (
    <ResponsiveShell className="py-10">
      {/* Success header */}
      <div className={`mb-8 rounded-2xl border p-6 text-center ${pendingFulfilment ? 'border-amber-200 bg-amber-50' : 'border-teal-200 bg-teal-50'}`}>
        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${pendingFulfilment ? 'bg-amber-100' : 'bg-teal-100'}`}>
          <svg className={`h-7 w-7 ${pendingFulfilment ? 'text-amber-700' : 'text-teal-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={pendingFulfilment ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'} />
          </svg>
        </div>
        <h1 className={`text-2xl font-bold ${pendingFulfilment ? 'text-amber-900' : 'text-teal-900'}`}>{headline}</h1>
        <p className={`mt-1.5 text-sm ${pendingFulfilment ? 'text-amber-700' : 'text-teal-700'}`}>
          {subline}
        </p>
      </div>

      <PageHeader
        eyebrow="Booking confirmed"
        title={detail.title}
        description={`${detail.originLabel} → ${detail.destinationLabel}`}
      />

      {/* Key details */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ConfirmationCard
          label="Booking reference"
          value={detail.booking.confirmationNumber ?? 'Pending'}
          highlight
        />
        <ConfirmationCard
          label="Departure"
          value={formatDate(detail.departureDate)}
        />
        <ConfirmationCard
          label="Return"
          value={formatDate(detail.returnDate)}
        />
        <ConfirmationCard
          label="Travelers"
          value={`${detail.travelerCount} traveler${detail.travelerCount !== 1 ? 's' : ''}`}
        />
      </div>

      {/* What's included */}
      {selected && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">What&apos;s included</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flight</p>
              <p className="mt-1 font-semibold text-slate-900">{selected.flight.airline}</p>
              <p className="text-sm text-slate-600">
                {selected.flight.flightNumber} · {selected.flight.stops === 0 ? 'Direct' : `${selected.flight.stops} stop`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hotel</p>
              <p className="mt-1 font-semibold text-slate-900">{selected.hotel.name}</p>
              <p className="text-sm text-slate-600">
                {selected.hotel.stars}★ · {selected.hotel.nights} nights
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation policy */}
      <div className={`mb-6 rounded-2xl border p-4 text-sm ${
        isRefundable
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}>
        <p className="font-medium">
          {isRefundable ? '✅ Fully refundable bundle' : '⚠️ Partial refund policy'}
        </p>
        {cancellationDeadline && (
          <p className="mt-1 text-xs">
            Hotel cancellation deadline: <strong>{cancellationDeadline}</strong>
          </p>
        )}
        {!isRefundable && (
          <p className="mt-1 text-xs">At least one component of this package is non-refundable.</p>
        )}
      </div>

      <div className="mb-6">
        <ShareItineraryButton tripId={trip.id} />
      </div>

      <div className="flex flex-wrap gap-3">
        <LinkButton href={`/trips/${trip.id}`}>View full trip details</LinkButton>
        <LinkButton href="/trips" variant="secondary">Back to dashboard</LinkButton>
      </div>
    </ResponsiveShell>
  );
}
