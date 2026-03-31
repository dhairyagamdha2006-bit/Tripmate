import type { PaymentProvider } from '@/server/integrations/contracts';
import type { PaymentAuthorizationInput, PaymentAuthorizationResult } from '@/types/travel';

export class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  async authorize(_input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult> {
    throw new Error('Stripe integration is not implemented yet. Replace this placeholder when provider credentials are available.');
  }
}
