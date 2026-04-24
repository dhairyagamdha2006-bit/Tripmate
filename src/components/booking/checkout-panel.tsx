"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/money';
import { BookingStatusBadge } from '@/components/trip/booking-status-badge';

export function CheckoutPanel({
  booking,
  paymentMethods,
  publishableKey
}: {
  booking: any;
  paymentMethods: any[];
  publishableKey?: string;
}) {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods.find((item) => item.isDefault)?.id ?? paymentMethods[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Payment is processed through Stripe. After payment, Tripmate will keep the booking state honest: paid, requested,
            confirmed, or pending manual fulfillment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <BookingStatusBadge status={booking.paymentStatus} />
            <BookingStatusBadge status={booking.fulfillmentStatus} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-sm text-slate-400">Total due</div>
            <div className="mt-2 text-3xl font-semibold text-white">{formatCurrency(booking.totalPriceCents, booking.currency)}</div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">Saved payment method</label>
            <select
              value={selectedPaymentMethodId}
              onChange={(event) => setSelectedPaymentMethodId(event.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-white"
            >
              <option value="">Select a payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {(method.brand ?? 'card').toUpperCase()} •••• {method.last4}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={loading || !selectedPaymentMethodId || !publishableKey}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/bookings/${booking.id}/payment-intent`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentMethodId: selectedPaymentMethodId })
                });
                const data = (await response.json()) as { ok: boolean; error?: string; status?: string; clientSecret?: string; paymentIntentId?: string };
                if (!response.ok || !data.ok || !data.paymentIntentId) {
                  setLoading(false);
                  setError(data.error ?? 'Failed to start payment.');
                  return;
                }

                try {
                  if (data.status === 'requires_action' && data.clientSecret && stripePromise) {
                    const stripe = await stripePromise;
                    if (!stripe) {
                      throw new Error('Stripe.js failed to load.');
                    }
                    const confirmResult = await stripe.confirmCardPayment(data.clientSecret);
                    if (confirmResult.error) {
                      throw new Error(confirmResult.error.message ?? 'Payment authentication failed.');
                    }
                  }

                  await fetch(`/api/bookings/${booking.id}/after-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: data.paymentIntentId })
                  });

                  window.location.reload();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Payment failed.');
                }
                setLoading(false);
              }}
            >
              {loading ? 'Processing payment...' : 'Pay now'}
            </Button>
            <Link href="/profile">
              <Button variant="outline">Manage payment methods</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>1. Stripe confirms payment using your saved card.</p>
          <p>2. Tripmate marks the booking request honestly: paid, requested, confirmed, or pending manual fulfillment.</p>
          <p>3. Confirmation and reminder emails are sent through SendGrid when configured.</p>
        </CardContent>
      </Card>
    </div>
  );
}
