'use client';

import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SetupIntentResponse = {
  clientSecret: string | null;
  customerId: string;
  publishableKey: string | null;
};

type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  provider: string;
};

export function AddPaymentMethodForm() {
  const [setup, setSetup] = useState<SetupIntentResponse | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function refreshCards() {
    const res = await fetch('/api/payment-methods', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setSavedCards(data.paymentMethods ?? []);
    }
  }

  async function initSetupIntent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/setup-intent', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to initialize Stripe.');
      }
      const data: SetupIntentResponse = await res.json();
      if (!data.publishableKey) {
        throw new Error('Stripe publishable key is not configured.');
      }
      setSetup(data);
      setStripePromise(loadStripe(data.publishableKey));
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Stripe.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCards().finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment methods</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cards are stored securely by Stripe. Tripmate only keeps the brand, last four digits, and expiry for display.
            </p>
          </div>
          {!showForm ? (
            <Button type="button" onClick={initSetupIntent} disabled={loading}>
              {loading ? 'Loading…' : 'Add card'}
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {savedCards.length === 0 && !showForm ? (
          <p className="text-sm text-slate-500">You have no saved cards yet.</p>
        ) : null}

        {savedCards.length > 0 ? (
          <ul className="space-y-2">
            {savedCards.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-900">{card.brand ?? 'Card'}</span>{' '}
                  <span className="text-slate-500">•••• {card.last4 ?? '----'}</span>
                  {card.expiryMonth && card.expiryYear ? (
                    <span className="ml-2 text-slate-400">
                      {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                    </span>
                  ) : null}
                </div>
                {card.isDefault ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Default
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {showForm && setup?.clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: setup.clientSecret, appearance: { theme: 'stripe' } }}
          >
            <InnerCardForm
              customerId={setup.customerId}
              onSaved={async () => {
                setShowForm(false);
                setSetup(null);
                setStripePromise(null);
                await refreshCards();
              }}
              onCancel={() => {
                setShowForm(false);
                setSetup(null);
                setStripePromise(null);
              }}
            />
          </Elements>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InnerCardForm({
  customerId,
  onSaved,
  onCancel
}: {
  customerId: string;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Unable to validate card.');
      setSubmitting(false);
      return;
    }

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/profile`
      }
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Unable to save card.');
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setError('Stripe did not return a payment method id.');
      setSubmitting(false);
      return;
    }

    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId, customerId })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to save card.');
      setSubmitting(false);
      return;
    }

    await onSaved();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? 'Saving…' : 'Save card'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
