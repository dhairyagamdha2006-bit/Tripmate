import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDate } from '@/lib/utils/date';
import type { HotelView } from '@/types/travel';

export function HotelSummaryCard({ hotel }: { hotel: HotelView }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hotel</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{hotel.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{hotel.neighborhood ?? hotel.city} · {hotel.address}</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{'★'.repeat(hotel.stars)} {hotel.rating ? `${hotel.rating}/10` : ''}</p>
          </div>
          <div className="md:text-right">
            <p className="text-lg font-bold text-slate-900">{formatCurrency(hotel.totalPriceCents)}</p>
            <p className="text-sm text-slate-500">{formatCurrency(hotel.pricePerNightCents)} per night</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={hotel.refundable ? 'emerald' : 'amber'}>{hotel.refundable ? 'Refundable' : 'Non-refundable'}</Badge>
          <Badge tone="blue">{hotel.nights} nights</Badge>
          {hotel.cancellationDeadline ? <Badge tone="slate">Free cancellation until {formatDate(hotel.cancellationDeadline)}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}
