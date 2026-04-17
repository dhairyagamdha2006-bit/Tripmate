import { z } from 'zod';
import { getStripe, hasStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string().startsWith('pm_', 'Must be a Stripe payment method id'),
  customerId: z.string().startsWith('cus_').optional()
});

/**
 * List the current user's saved payment methods.
 */
export async function GET() {
  const user = await requireApiUser();
  const methods = await prisma.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      brand: true,
      last4: true,
      expiryMonth: true,
      expiryYear: true,
      isDefault: true,
      provider: true
    }
  });
  return jsonOk({ paymentMethods: methods });
}

/**
 * Persist a Stripe PaymentMethod that the browser just created via
 * Stripe Elements. We look up the PM from Stripe to populate brand /
 * last4 / expiry, and attach it to the customer if needed.
 */
export async function POST(request: Request) {
  if (!hasStripe()) {
    return jsonError('Stripe is not configured on the server.', 503);
  }

  const user = await requireApiUser();
  const stripe = getStripe();

  const parsed = savePaymentMethodSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError('Validation failed.', 400);
  }
  const { paymentMethodId, customerId } = parsed.data;

  const stripePm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (!stripePm || stripePm.type !== 'card') {
    return jsonError('Unsupported payment method type.', 400);
  }

  // Make sure the PM is attached to the customer.
  let effectiveCustomerId = customerId ?? (stripePm.customer as string | null);
  if (!effectiveCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id }
    });
    effectiveCustomerId = customer.id;
    await stripe.paymentMethods.attach(paymentMethodId, { customer: effectiveCustomerId });
  } else if (stripePm.customer !== effectiveCustomerId) {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: effectiveCustomerId });
  }

  const existing = await prisma.paymentMethod.findFirst({
    where: { userId: user.id, providerPaymentMethodId: paymentMethodId }
  });
  if (existing) {
    return jsonOk({ paymentMethodId: existing.id });
  }

  const hasAny = await prisma.paymentMethod.count({ where: { userId: user.id } });

  const created = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      provider: 'stripe',
      providerPaymentMethodId: paymentMethodId,
      providerCustomerId: effectiveCustomerId,
      brand: stripePm.card?.brand ?? null,
      last4: stripePm.card?.last4 ?? null,
      expiryMonth: stripePm.card?.exp_month ?? null,
      expiryYear: stripePm.card?.exp_year ?? null,
      isDefault: hasAny === 0
    }
  });

  return jsonOk({ paymentMethodId: created.id });
}
