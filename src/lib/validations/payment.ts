import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  paymentMethodId: z.string().min(1)
});

export const afterPaymentSchema = z.object({
  paymentIntentId: z.string().min(1)
});
