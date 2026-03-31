import { notFound } from 'next/navigation';
import { ConfirmationCard } from '@/components/booking/confirmation-card';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { LinkButton } from '@/components/ui/link-button';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';

export default async function BookingSuccessPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();
  const request = trip.requests[0];
  if (!request) notFound();
  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });
  if (!detail.booking) notFound();

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Booked"
        title="Your trip is confirmed"
        description="Tripmate completed the mock booking flow successfully. Review your itinerary and confirmations below."
      />
      <div className="grid gap-5 md:grid-cols-3">
        <ConfirmationCard label="Booking reference" value={detail.booking.confirmationNumber ?? 'Pending'} />
        <ConfirmationCard label="Trip" value={detail.title} />
        <ConfirmationCard label="Status" value={detail.booking.status.replaceAll('_', ' ')} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={`/trips/${trip.id}`}>View trip details</LinkButton>
        <LinkButton href="/trips" variant="secondary">Back to dashboard</LinkButton>
      </div>
    </ResponsiveShell>
  );
}
