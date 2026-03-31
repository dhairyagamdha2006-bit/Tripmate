import type { PaymentProvider } from '@/server/integrations/contracts';
import type { PaymentAuthorizationInput, PaymentAuthorizationResult } from '@/types/travel';

export class MockPaymentProvider implements PaymentProvider {
  name = 'mock-stripe';

  async authorize(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult> {
    if (!input.paymentMethodId) {
      return { success: false, failureReason: 'No payment method available.' };
    }

    return {
      success: true,
      providerReference: `pay_${input.paymentMethodId.slice(-8)}`
    };
  }
}
