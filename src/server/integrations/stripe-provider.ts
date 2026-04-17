import type { PaymentProvider } from './contracts';
import type {
  PaymentAuthorizationInput,
  PaymentAuthorizationResult
} from '@/types/travel';
import { getStripe, hasStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

/**
 * Stripe PaymentIntents integration.
 *
 * We authorize (create + confirm a PaymentIntent) using the saved
 * `providerPaymentMethodId` for the user's default card, then return the
 * PaymentIntent id so the booking service can record it and reconcile
 * with the webhook. We explicitly do not capture here — the downstream
 * flow can capture on provider confirmation or refund on failure.
 */
export class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  async authorize(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult> {
    if (!hasStripe()) {
      return { success: false, failureReason: 'Stripe is not configured.' };
    }
    if (!input.paymentMethodId) {
      return { success: false, failureReason: 'No payment method provided.' };
    }

    const record = await prisma.paymentMethod.findUnique({
      where: { id: input.paymentMethodId },
      select: {
        userId: true,
        providerPaymentMethodId: true,
        providerCustomerId: true
      }
    });

    if (!record?.providerPaymentMethodId) {
      return { success: false, failureReason: 'Payment method not found.' };
    }
    if (record.userId !== input.userId) {
      return { success: false, failureReason: 'Payment method does not belong to this user.' };
    }

    try {
      const stripe = getStripe();

      const intent = await stripe.paymentIntents.create({
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        payment_method: record.providerPaymentMethodId,
        customer: record.providerCustomerId ?? undefined,
        confirm: true,
        capture_method: 'manual',
        description: input.description,
        metadata: {
          userId: input.userId,
          paymentMethodId: input.paymentMethodId
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      if (intent.status === 'requires_capture' || intent.status === 'succeeded') {
        return {
          success: true,
          providerReference: intent.id,
          status: intent.status
        };
      }

      return {
        success: false,
        failureReason: `Payment status: ${intent.status}. Please try a different payment method.`,
        providerReference: intent.id,
        status: intent.status
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed.';
      return { success: false, failureReason: message };
    }
  }
}
