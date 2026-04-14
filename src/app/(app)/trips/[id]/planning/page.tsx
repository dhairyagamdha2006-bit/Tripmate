import { notFound } from 'next/navigation';
import { AIChatPanel } from '@/components/trip/ai-chat-panel';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { StepProgress } from '@/components/trip/step-progress';
import { PlanningRunner } from '@/components/trip/planning-runner';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripDetail } from '@/server/mappers/trip.mapper';

export default async function PlanningPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) notFound();

  const request = trip.requests[0];
  if (!request) notFound();
  const detail = mapTripDetail({ trip, request, booking: trip.bookings[0] ?? null });

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="AI planning"
        title={trip.title}
        description="Tripmate is using your saved profile and current request to search and rank the best bundles."
      />
      <div className="mb-8">
        <StepProgress steps={['Trip details', 'Planning', 'Recommendations', 'Book']} current={1} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PlanningRunner tripId={trip.id} status={trip.status} />
        <AIChatPanel messages={detail.agentMessages} tripId={trip.id} />
      </div>
    </ResponsiveShell>
  );
}
