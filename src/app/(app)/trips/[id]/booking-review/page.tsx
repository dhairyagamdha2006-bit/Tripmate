import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { StepProgress } from '@/components/trip/step-progress';
import { FlightSummaryCard } from '@/components/trip/flight-summary-card';
import { HotelSummaryCard } from '@/components/trip/hotel-summary-card';
import { PriceBreakdown } from '@/components/booking/price-breakdown';
import { ApproveBookingButton } from '@/components/booking/approve-booking-button';
import { TrustBanner } from '@/components/common/trust-banner';
import { Card, CardContent } from '@/components/ui/card';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';
import { formatDate } from '@/lib/utils/date';

export default async function BookingReviewPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();
  const request = trip.requests[0];
  if (!request) notFound();
  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });

  if (!detail.selectedPackageId) {
    redirect(`/trips/${trip.id}/recommendations`);
  }

  const selected = detail.packages.find((pkg) => pkg.id === detail.selectedPackageId);
  if (!selected) {
    redirect(`/trips/${trip.id}/recommendations`);
  }

  const flightTotal = selected.totalPriceCents - selected.hotel.totalPriceCents;

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Booking review"
        title="Review before booking"
        description="Check every detail carefully. Tripmate will only proceed after your explicit confirmation."
      />
      <div className="mb-8">
        <StepProgress steps={['Trip details', 'Planning', 'Recommendations', 'Book']} current={3} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <FlightSummaryCard flight={selected.flight} title="Outbound flight" />
          {selected.flight.returnFlightNumber ? (
            <FlightSummaryCard
              flight={{
                ...selected.flight,
                flightNumber: selected.flight.returnFlightNumber,
                originCode: selected.flight.destinationCode,
                destinationCode: selected.flight.originCode,
                departureTime: selected.flight.returnDepartureTime ?? selected.flight.departureTime,
                arrivalTime: selected.flight.returnArrivalTime ?? selected.flight.arrivalTime,
                durationMinutes: selected.flight.returnDurationMinutes ?? selected.flight.durationMinutes,
                stops: selected.flight.returnStops ?? selected.flight.stops
              }}
              title="Return flight"
            />
          ) : null}
          <HotelSummaryCard hotel={selected.hotel} />
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Cancellation terms</h3>
              <p className="text-sm text-slate-600">{selected.flight.refundable && selected.hotel.refundable ? 'Both flight and hotel are currently refundable.' : 'At least one part of this package has reduced flexibility.'}</p>
              {selected.hotel.cancellationDeadline ? <p className="text-sm text-slate-500">Hotel cancellation deadline: {formatDate(selected.hotel.cancellationDeadline)}</p> : null}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <TrustBanner message="Tripmate never books without your explicit approval. Your card is authorized (not charged) until a provider confirms availability. If provider fulfilment is unavailable, your hold is released and Tripmate marks the trip as pending fulfilment with no confirmation number." />
          <Card>
            <CardContent className="space-y-5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected package</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{selected.label.replaceAll('_', ' ')}</h3>
                <p className="mt-2 text-sm text-slate-500">{selected.explanation}</p>
              </div>
              <PriceBreakdown flightTotalCents={flightTotal} hotelTotalCents={selected.hotel.totalPriceCents} totalCents={selected.totalPriceCents} currency={selected.currency} />
              <ApproveBookingButton tripId={trip.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveShell>
  );
}
