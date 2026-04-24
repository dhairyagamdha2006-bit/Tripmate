"use client";

import { useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PaymentSetupForm({
  onSuccess,
  onCancel
}: {
  onSuccess: (setupIntentId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        setError(null);
        const result = await stripe.confirmSetup({
          elements,
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.href
          }
        });
        if (result.error || !result.setupIntent) {
          setLoading(false);
          setError(result.error?.message ?? 'Failed to confirm payment method.');
          return;
        }

        try {
          await onSuccess(result.setupIntent.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save payment method.');
        }
        setLoading(false);
      }}
    >
      <PaymentElement />
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={!stripe || loading}>{loading ? 'Saving...' : 'Save card'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function PaymentMethodManager({
  paymentMethods,
  publishableKey
}: {
  paymentMethods: Array<any>;
  publishableKey?: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved payment methods</CardTitle>
        <CardDescription>Cards are stored in Stripe and referenced in Tripmate by tokenized payment method IDs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {paymentMethods.length ? paymentMethods.map((method) => (
            <div key={method.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div>
                <div className="font-medium text-white">{(method.brand ?? 'card').toUpperCase()} •••• {method.last4}</div>
                <div className="text-sm text-slate-400">Expires {method.expiryMonth}/{method.expiryYear} {method.isDefault ? '· default' : ''}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fetch(`/api/profile/payment-methods?paymentMethodId=${method.id}`, { method: 'DELETE' });
                  window.location.reload();
                }}
              >
                Remove
              </Button>
            </div>
          )) : <p className="text-sm text-slate-400">No saved cards yet.</p>}
        </div>

        {publishableKey ? (
          clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentSetupForm
                onCancel={() => setClientSecret(null)}
                onSuccess={async (setupIntentId) => {
                  const response = await fetch('/api/profile/payment-methods', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ setupIntentId })
                  });
                  const data = (await response.json()) as { ok: boolean; error?: string };
                  if (!response.ok || !data.ok) {
                    throw new Error(data.error ?? 'Failed to save card.');
                  }
                  setClientSecret(null);
                  setSuccess('Payment method saved.');
                  window.location.reload();
                }}
              />
            </Elements>
          ) : (
            <Button
              type="button"
              onClick={async () => {
                setError(null);
                setSuccess(null);
                const response = await fetch('/api/profile/payment-methods/setup-intent', { method: 'POST' });
                const data = (await response.json()) as { ok: boolean; error?: string; clientSecret?: string };
                if (!response.ok || !data.ok || !data.clientSecret) {
                  setError(data.error ?? 'Failed to start card setup.');
                  return;
                }
                setClientSecret(data.clientSecret);
              }}
            >
              Add payment method
            </Button>
          )
        ) : (
          <p className="text-sm text-amber-300">Stripe is not configured yet. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY.</p>
        )}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      </CardContent>
    </Card>
  );
}
