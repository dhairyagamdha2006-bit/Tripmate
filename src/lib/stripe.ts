import Stripe from 'stripe';

let cached: Stripe | null = null;

/**
 * Returns a singleton Stripe client. Throws if `STRIPE_SECRET_KEY` is not
 * configured, so callers should guard with `hasStripe()` where appropriate.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  cached = new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
    appInfo: { name: 'Tripmate', version: '1.0.0' }
  });
  return cached;
}

export function hasStripe(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
