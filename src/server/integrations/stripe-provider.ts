import type { PaymentProvider } from './contracts';
import type { PaymentAuthorizationInput, PaymentAuthorizationResult } from '@/types/travel';

export class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  async authorize(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { success: false, failureReason: 'Stripe is not configured.' };
    }
    if (!input.paymentMethodId) {
      return { success: false, failureReason: 'No payment method provided.' };
    }

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

      const { prisma } = await import('@/lib/db/prisma');
      const record = await prisma.paymentMethod.findUnique({
        where: { id: input.paymentMethodId },
        select: { providerPaymentMethodId: true }
      });

      if (!record?.providerPaymentMethodId) {
        return { success: false, failureReason: 'Payment method not found.' };
      }

      const intent = await stripe.paymentIntents.create({
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        payment_method: record.providerPaymentMethodId,
        confirm: true,
        description: input.description,
        meta { userId: input.userId },
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      if (intent.status === 'succeeded') {
        return { success: true, providerReference: intent.id };
      }

      return {
        success: false,
        failureReason: `Payment status: ${intent.status}. Please try a different payment method.`
      };
    } catch (err: unknown) {
      return {
        success: false,
        failureReason: err instanceof Error ? err.message : 'Payment failed.'
      };
    }
  }
}
