import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { StepProgress } from '@/components/trip/step-progress';
import { ComparisonTable } from '@/components/trip/comparison-table';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';

export default async function ComparisonPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();
  const request = trip.requests[0];
  if (!request) notFound();
  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Compare"
        title="Side-by-side comparison"
        description="Use the comparison table to review price, stops, hotel rating, and flexibility across all bundles."
      />
      <div className="mb-8">
        <StepProgress steps={['Trip details', 'Planning', 'Recommendations', 'Book']} current={2} />
      </div>
      <ComparisonTable packages={detail.packages} />
    </ResponsiveShell>
  );
}
