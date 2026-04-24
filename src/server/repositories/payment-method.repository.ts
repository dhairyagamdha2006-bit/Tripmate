import { prisma } from '@/lib/db/prisma';

export const paymentMethodRepository = {
  async findAnyCustomerIdForUser(userId: string) {
    const record = await prisma.paymentMethod.findFirst({
      where: { userId, provider: 'stripe', providerCustomerId: { not: null } },
      orderBy: { createdAt: 'asc' }
    });
    return record?.providerCustomerId ?? null;
  },

  listByUser(userId: string) {
    return prisma.paymentMethod.findMany({
      where: { userId, provider: 'stripe' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  },

  findByIdForUser(paymentMethodId: string, userId: string) {
    return prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId }
    });
  },

  async upsertStripeMethod(input: {
    userId: string;
    customerId: string;
    paymentMethodId: string;
    brand?: string | null;
    last4?: string | null;
    expiryMonth?: number | null;
    expiryYear?: number | null;
    billingName?: string | null;
    billingEmail?: string | null;
    isDefault?: boolean;
  }) {
    if (input.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: input.userId, provider: 'stripe' },
        data: { isDefault: false }
      });
    }

    return prisma.paymentMethod.upsert({
      where: { providerPaymentMethodId: input.paymentMethodId },
      create: {
        userId: input.userId,
        provider: 'stripe',
        providerCustomerId: input.customerId,
        providerPaymentMethodId: input.paymentMethodId,
        brand: input.brand ?? undefined,
        last4: input.last4 ?? undefined,
        expiryMonth: input.expiryMonth ?? undefined,
        expiryYear: input.expiryYear ?? undefined,
        billingName: input.billingName ?? undefined,
        billingEmail: input.billingEmail ?? undefined,
        isDefault: input.isDefault ?? false
      },
      update: {
        providerCustomerId: input.customerId,
        brand: input.brand ?? undefined,
        last4: input.last4 ?? undefined,
        expiryMonth: input.expiryMonth ?? undefined,
        expiryYear: input.expiryYear ?? undefined,
        billingName: input.billingName ?? undefined,
        billingEmail: input.billingEmail ?? undefined,
        isDefault: input.isDefault ?? false
      }
    });
  },

  async deleteForUser(id: string, userId: string) {
    return prisma.paymentMethod.deleteMany({
      where: { id, userId }
    });
  }
};
