import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDate } from '@/lib/utils/date';
import type { TripCardView } from '@/types/travel';

export function DashboardTripCard({ trip }: { trip: TripCardView }) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-card-md">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Upcoming trip</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{trip.title}</h3>
            </div>
            <StatusBadge status={trip.bookingStatus ?? trip.status} />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 px-5 py-7 text-white">
            <p className="text-sm text-blue-100">{trip.originLabel}</p>
            <p className="mt-2 font-serif text-2xl">{trip.destinationLabel}</p>
            <p className="mt-3 text-sm text-blue-100">{formatDate(trip.departureDate)} – {formatDate(trip.returnDate)}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{trip.travelerCount} traveler{trip.travelerCount > 1 ? 's' : ''}</span>
            {trip.totalPriceCents ? <span className="font-semibold text-slate-900">{formatCurrency(trip.totalPriceCents)}</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
