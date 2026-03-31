import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { DashboardTripCard } from '@/components/dashboard/dashboard-trip-card';
import { LinkButton } from '@/components/ui/link-button';
import { requireCurrentUser } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';
import { mapTripCard } from '@/server/mappers/trip.mapper';

export default async function TripsDashboardPage() {
  const user = await requireCurrentUser();
  const trips = await tripService.listTripsForUser(user.id);
  const mapped = trips.map(mapTripCard);

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="My Trips"
        title="Trips dashboard"
        description="Review confirmed bookings, active planning work, and recent Tripmate recommendations."
        actions={<LinkButton href="/trips/new">Plan a trip</LinkButton>}
      />

      {mapped.length === 0 ? (
        <EmptyState
          title="No trips yet"
          description="Create your first trip request and Tripmate will start searching flight and hotel bundles for you."
          action={<LinkButton href="/trips/new">Plan your first trip</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {mapped.map((trip) => (
            <DashboardTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </ResponsiveShell>
  );
}
