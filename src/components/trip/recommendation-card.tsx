'use client';

import { ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDuration, formatStops } from '@/lib/utils/date';
import type { PackageView } from '@/types/travel';

const labelTones = {
  BEST_VALUE: 'emerald',
  CHEAPEST: 'blue',
  MOST_CONVENIENT: 'amber',
  PREMIUM: 'violet',
  MOST_FLEXIBLE: 'slate'
} as const;

const labelText = {
  BEST_VALUE: 'Best Value',
  CHEAPEST: 'Cheapest',
  MOST_CONVENIENT: 'Most Convenient',
  PREMIUM: 'Premium',
  MOST_FLEXIBLE: 'Most Flexible'
} as const;

export function RecommendationCard({
  pkg,
  budgetCents,
  selected,
  onSelect,
  disabled
}: {
  pkg: PackageView;
  budgetCents: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  disabled?: boolean;
}) {
  const overBudget = pkg.totalPriceCents > budgetCents;

  return (
    <Card className={cn('border-2 transition-all', selected ? 'border-blue-500 bg-blue-50/60 shadow-card-lg' : 'hover:border-blue-200 hover:shadow-card-md')}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={labelTones[pkg.label]}>{labelText[pkg.label]}</Badge>
                {pkg.recommended ? <Badge tone="emerald">Tripmate’s pick</Badge> : null}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{pkg.flight.airline} + {pkg.hotel.name}</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{pkg.explanation}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Flight</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatStops(pkg.flight.stops)} · {formatDuration(pkg.flight.durationMinutes)}</p>
                <p className="text-xs text-slate-500">{pkg.flight.flightNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Hotel</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{'★'.repeat(pkg.hotel.stars)} {pkg.hotel.rating ? `${pkg.hotel.rating}/10` : 'New listing'}</p>
                <p className="text-xs text-slate-500">{pkg.hotel.neighborhood ?? pkg.hotel.city}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Refundability</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{pkg.flight.refundable && pkg.hotel.refundable ? 'Fully refundable' : 'Mixed policy'}</p>
                <p className="text-xs text-slate-500">Review cancellation terms before booking</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Match score</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-blue-600" /> {pkg.score.overall}/100
                </div>
                <p className="text-xs text-slate-500">Scored against price, convenience, and preferences</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {pkg.highlights.map((highlight) => (
                <Badge key={highlight} tone="emerald"><CheckCircle2 className="h-3 w-3" />{highlight}</Badge>
              ))}
              {pkg.warnings.map((warning) => (
                <Badge key={warning} tone="amber"><AlertTriangle className="h-3 w-3" />{warning}</Badge>
              ))}
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(pkg.totalPriceCents, pkg.currency)}</p>
              <p className={cn('mt-2 text-sm font-medium', overBudget ? 'text-amber-700' : 'text-emerald-700')}>
                {overBudget ? `${formatCurrency(pkg.totalPriceCents - budgetCents)} over budget` : `${formatCurrency(budgetCents - pkg.totalPriceCents)} under budget`}
              </p>
            </div>

            {onSelect ? (
              <Button className="mt-5 w-full" variant={selected ? 'success' : 'primary'} onClick={() => onSelect(pkg.id)} disabled={disabled}>
                {selected ? 'Selected' : 'Select package'}
                {!selected ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
