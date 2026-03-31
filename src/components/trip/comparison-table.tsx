'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDuration, formatStops } from '@/lib/utils/date';
import type { PackageView } from '@/types/travel';

const labelText = {
  BEST_VALUE: 'Best Value',
  CHEAPEST: 'Cheapest',
  MOST_CONVENIENT: 'Most Convenient',
  PREMIUM: 'Premium',
  MOST_FLEXIBLE: 'Most Flexible'
} as const;

export function ComparisonTable({ packages, onSelect }: { packages: PackageView[]; onSelect?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="min-w-[900px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-4 font-semibold text-slate-600">Feature</th>
            {packages.map((pkg) => (
              <th key={pkg.id} className="px-4 py-4 text-center">
                <Badge tone="blue">{labelText[pkg.label]}</Badge>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['Total price', (pkg: PackageView) => formatCurrency(pkg.totalPriceCents, pkg.currency)],
            ['Flight', (pkg: PackageView) => `${pkg.flight.airline} · ${pkg.flight.flightNumber}`],
            ['Stops', (pkg: PackageView) => formatStops(pkg.flight.stops)],
            ['Travel time', (pkg: PackageView) => formatDuration(pkg.flight.durationMinutes)],
            ['Hotel', (pkg: PackageView) => pkg.hotel.name],
            ['Location', (pkg: PackageView) => pkg.hotel.neighborhood ?? pkg.hotel.city],
            ['Hotel rating', (pkg: PackageView) => (pkg.hotel.rating ? `${pkg.hotel.rating}/10` : '—')],
            ['Refundable', (pkg: PackageView) => (pkg.flight.refundable && pkg.hotel.refundable ? 'Yes' : 'Partial / No')],
            ['Score', (pkg: PackageView) => `${pkg.score.overall}/100`]
          ].map(([label, render]) => (
            <tr key={label as string} className="border-t border-slate-100">
              <td className="px-4 py-4 font-medium text-slate-700">{label as string}</td>
              {packages.map((pkg) => (
                <td key={pkg.id + label} className="px-4 py-4 text-center text-slate-600">{(render as (pkg: PackageView) => string)(pkg)}</td>
              ))}
            </tr>
          ))}
          {onSelect ? (
            <tr className="border-t border-slate-100">
              <td className="px-4 py-4 font-medium text-slate-700">Action</td>
              {packages.map((pkg) => (
                <td key={pkg.id + 'action'} className="px-4 py-4 text-center">
                  <Button size="sm" onClick={() => onSelect(pkg.id)}>Select</Button>
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
