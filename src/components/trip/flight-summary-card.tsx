import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatDuration } from '@/lib/utils/date';
import type { FlightView } from '@/types/travel';

export function FlightSummaryCard({ flight, title }: { flight: FlightView; title: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-lg font-bold text-slate-900">{flight.originCode}</p>
            <p className="text-sm text-slate-500">{formatDateTime(flight.departureTime)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{flight.airline} · {flight.flightNumber}</p>
            <p className="text-xs text-slate-500">{formatDuration(flight.durationMinutes)} · {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</p>
          </div>
          <div className="md:text-right">
            <p className="text-lg font-bold text-slate-900">{flight.destinationCode}</p>
            <p className="text-sm text-slate-500">{formatDateTime(flight.arrivalTime)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={flight.refundable ? 'emerald' : 'amber'}>{flight.refundable ? 'Refundable' : 'Review fare rules'}</Badge>
          <Badge tone="blue">{flight.cabinClass.replaceAll('_', ' ')}</Badge>
          {flight.loyaltyProgram ? <Badge tone="slate">{flight.loyaltyProgram}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}
