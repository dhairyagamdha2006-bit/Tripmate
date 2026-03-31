import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDateTime } from '@/lib/utils/date';
import type { BookingSummaryView } from '@/types/travel';

export function BookingSummaryCard({ booking }: { booking: BookingSummaryView }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Booking summary</CardTitle>
          <StatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Confirmation</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{booking.confirmationNumber ?? 'Pending confirmation'}</p>
          {booking.bookedAt ? <p className="mt-1 text-sm text-slate-500">Booked {formatDateTime(booking.bookedAt)}</p> : null}
        </div>
        <div className="space-y-3">
          {booking.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="font-medium text-slate-900">{item.displayName}</p>
                <p className="text-sm text-slate-500">{item.providerReference ?? 'Pending reference'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(item.amountCents)}</p>
                <p className="text-xs text-slate-500">{item.status.replaceAll('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
