import { getStripe, hasStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

/**
 * Creates a SetupIntent so the browser can collect a card and save it
 * to the user's Stripe customer. Returns the client secret plus the
 * customer id. The frontend then uses Stripe.js Elements to confirm
 * the setup intent and POST back to `/api/payment-methods` with the
 * resulting `paymentMethodId`.
 */
export async function POST() {
  if (!hasStripe()) {
    return jsonError('Stripe is not configured on the server.', 503);
  }

  const user = await requireApiUser();
  const stripe = getStripe();

  // Find or create a Stripe customer for the user by searching a
  // previously-saved payment method. Keeps the schema minimal.
  const existing = await prisma.paymentMethod.findFirst({
    where: { userId: user.id, provider: 'stripe', providerCustomerId: { not: null } }
  });

  let customerId = existing?.providerCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id }
    });
    customerId = customer.id;
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    payment_method_types: ['card']
  });

  return jsonOk({
    clientSecret: setupIntent.client_secret,
    customerId,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null
  });
}
