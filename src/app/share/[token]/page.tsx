import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getPublicShare } from '@/server/services/share.service';
import { formatDate, formatDateTime } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

export default async function PublicSharePage({
  params
}: {
  params: { token: string };
}) {
  const share = await getPublicShare(params.token);
  if (!share) notFound();

  const price = share.totalPriceCents
    ? `${(share.totalPriceCents / 100).toFixed(0)} ${share.currency}`
    : null;

  const statusCopy =
    share.confirmationStatus === 'CONFIRMED'
      ? 'Confirmed itinerary'
      : share.confirmationStatus === 'PENDING_FULFILLMENT'
        ? 'Booking pending fulfilment with suppliers'
        : 'Trip in planning';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">✈</span>
            <span className="font-semibold">Tripmate</span>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Shared itinerary</p>
        </div>

        <article className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-wider text-teal-700">{statusCopy}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{share.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {share.originLabel} → {share.destinationLabel}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {formatDate(share.departureDate)} – {formatDate(share.returnDate)} · {share.travelerCount}{' '}
              {share.travelerCount === 1 ? 'traveller' : 'travellers'}
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 sm:px-8">
            {share.flight ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Flight</h2>
                <p className="mt-2 text-lg font-medium text-slate-900">
                  {share.flight.airline} · {share.flight.flightNumber}
                </p>
                <p className="text-sm text-slate-600">
                  {share.flight.originCode} → {share.flight.destinationCode}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Departs {formatDateTime(share.flight.departureTime)} · arrives{' '}
                  {formatDateTime(share.flight.arrivalTime)}
                </p>
                {share.flight.returnFlightNumber ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Return {share.flight.returnFlightNumber} ·{' '}
                    {share.flight.returnDepartureTime
                      ? formatDateTime(share.flight.returnDepartureTime)
                      : ''}
                  </p>
                ) : null}
              </div>
            ) : null}

            {share.hotel ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Hotel</h2>
                <p className="mt-2 text-lg font-medium text-slate-900">
                  {share.hotel.name}
                </p>
                <p className="text-sm text-slate-600">
                  {share.hotel.stars}★ · {share.hotel.neighborhood ?? share.hotel.city}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {share.hotel.nights} nights ·{' '}
                  {(share.hotel.pricePerNightCents / 100).toFixed(0)} {share.currency}/night
                </p>
              </div>
            ) : null}
          </div>

          {price ? (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm sm:px-8">
              <span className="font-medium text-slate-700">Estimated total</span>
              <span className="font-semibold text-slate-900">{price}</span>
            </div>
          ) : null}
        </article>

        <p className="mt-6 text-xs text-slate-400">
          This is a read-only view of someone&apos;s itinerary. Traveller personal details, payment
          information, and booking credentials are intentionally not shown.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-teal-700 underline underline-offset-4 hover:no-underline"
          >
            Plan your own trip with Tripmate
          </Link>
        </div>
      </div>
    </main>
  );
}
