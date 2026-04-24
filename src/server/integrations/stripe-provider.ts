import Stripe from 'stripe';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_NOT_CONFIGURED');
  }
  return new Stripe(secretKey);
}

export const stripeProvider = {
  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  },

  async createCustomer(input: { email?: string | null; name?: string | null; userId: string }) {
    const stripe = getStripe();
    return stripe.customers.create({
      email: input.email ?? undefined,
      name: input.name ?? undefined,
      metadata: { userId: input.userId }
    });
  },

  async createSetupIntent(input: { customerId: string; userId: string }) {
    const stripe = getStripe();
    return stripe.setupIntents.create({
      customer: input.customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: input.userId
      }
    });
  },

  async retrieveSetupIntent(setupIntentId: string) {
    const stripe = getStripe();
    return stripe.setupIntents.retrieve(setupIntentId);
  },

  async retrievePaymentMethod(paymentMethodId: string) {
    const stripe = getStripe();
    return stripe.paymentMethods.retrieve(paymentMethodId);
  },

  async detachPaymentMethod(paymentMethodId: string) {
    const stripe = getStripe();
    return stripe.paymentMethods.detach(paymentMethodId);
  },

  async createPaymentIntent(input: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId: string;
    metadata: Record<string, string>;
    description: string;
  }) {
    const stripe = getStripe();
    return stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      confirm: true,
      off_session: false,
      capture_method: process.env.STRIPE_CAPTURE_METHOD === 'manual' ? 'manual' : 'automatic',
      description: input.description,
      metadata: input.metadata,
      payment_method_types: ['card']
    });
  },

  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = getStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  },

  async capturePaymentIntent(paymentIntentId: string) {
    const stripe = getStripe();
    return stripe.paymentIntents.capture(paymentIntentId);
  },

  constructWebhookEvent(body: string, signature: string) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_NOT_CONFIGURED');
    }
    return stripe.webhooks.constructEvent(body, signature, secret);
  }
};
