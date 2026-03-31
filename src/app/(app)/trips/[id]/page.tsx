import { notFound } from 'next/navigation';
import { BookingSummaryCard } from '@/components/booking/booking-summary-card';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { StatusBadge } from '@/components/common/status-badge';
import { AIChatPanel } from '@/components/trip/ai-chat-panel';
import { RecommendationCard } from '@/components/trip/recommendation-card';
import { LinkButton } from '@/components/ui/link-button';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';
import { formatDate } from '@/lib/utils/date';

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();

  const request = trip.requests[0];
  if (!request) notFound();
  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Trip details"
        title={detail.title}
        description={`${formatDate(detail.departureDate)} – ${formatDate(detail.returnDate)} · ${detail.travelerCount} traveler${detail.travelerCount > 1 ? 's' : ''}`}
        actions={<StatusBadge status={detail.booking?.status ?? detail.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {detail.packages.length ? (
            <RecommendationCard
              pkg={detail.packages.find((pkg) => pkg.id === detail.selectedPackageId) ?? detail.packages[0]}
              budgetCents={detail.budgetCents}
            />
          ) : (
            <EmptyState
              title="No packages yet"
              description="Run the planning flow to generate recommendations for this trip."
              action={<LinkButton href={`/trips/${trip.id}/planning`}>Go to planning</LinkButton>}
            />
          )}
          <AIChatPanel messages={detail.agentMessages} />
        </div>
        <div className="space-y-5">
          {detail.booking ? <BookingSummaryCard booking={detail.booking} /> : null}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Trip state</h3>
            <p className="mt-3 text-sm text-slate-600">Flight options found: {detail.flightOptionsCount}</p>
            <p className="mt-1 text-sm text-slate-600">Hotel options found: {detail.hotelOptionsCount}</p>
            <p className="mt-1 text-sm text-slate-600">Recommendations available: {detail.packages.length}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href={`/trips/${trip.id}/recommendations`} variant="secondary">Recommendations</LinkButton>
              <LinkButton href={`/trips/${trip.id}/comparison`} variant="secondary">Compare</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveShell>
  );
}
