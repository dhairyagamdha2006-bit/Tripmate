import { formatCurrency } from '@/lib/formatters/currency';

export function PriceBreakdown({
  flightTotalCents,
  hotelTotalCents,
  totalCents,
  currency = 'USD'
}: {
  flightTotalCents: number;
  hotelTotalCents: number;
  totalCents: number;
  currency?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between py-2 text-sm text-slate-600">
        <span>Flights</span>
        <span className="font-semibold text-slate-900">{formatCurrency(flightTotalCents, currency)}</span>
      </div>
      <div className="flex items-center justify-between py-2 text-sm text-slate-600">
        <span>Hotel</span>
        <span className="font-semibold text-slate-900">{formatCurrency(hotelTotalCents, currency)}</span>
      </div>
      <div className="mt-3 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(totalCents, currency)}</span>
        </div>
      </div>
    </div>
  );
}
