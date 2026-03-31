import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { StepProgress } from '@/components/trip/step-progress';
import { RecommendationCard } from '@/components/trip/recommendation-card';
import { SelectPackageButton } from '@/components/trip/select-package-button';
import { LinkButton } from '@/components/ui/link-button';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';

export default async function RecommendationsPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();
  const request = trip.requests[0];
  if (!request) notFound();

  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Recommendations"
        title="Trip bundles ready"
        description="Each option below is scored on price fit, convenience, refundability, hotel quality, and profile match."
        actions={<LinkButton href={`/trips/${trip.id}/comparison`} variant="secondary">Compare all</LinkButton>}
      />
      <div className="mb-8">
        <StepProgress steps={['Trip details', 'Planning', 'Recommendations', 'Book']} current={2} />
      </div>
      {detail.packages.length === 0 ? (
        <EmptyState
          title="No recommendations yet"
          description="Start the planning step to generate bundles from the mock flight and hotel providers."
          action={<LinkButton href={`/trips/${trip.id}/planning`}>Go to planning</LinkButton>}
        />
      ) : (
        <div className="space-y-5">
          {detail.packages.map((pkg) => (
            <div key={pkg.id} className="space-y-3">
              <RecommendationCard pkg={pkg} budgetCents={detail.budgetCents} selected={detail.selectedPackageId === pkg.id} />
              <div className="flex justify-end">
                <SelectPackageButton tripId={trip.id} packageId={pkg.id} label={detail.selectedPackageId === pkg.id ? 'Review selected package' : 'Select this package'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ResponsiveShell>
  );
}
