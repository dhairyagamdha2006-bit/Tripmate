import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  createSession(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  },

  findSessionByToken(token: string) {
    return prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });
  },

  deleteSessionByToken(token: string) {
    return prisma.session.deleteMany({ where: { token } });
  },

  getDefaultPaymentMethod(userId: string) {
    return prisma.paymentMethod.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    });
  },

  async ensureMockPaymentMethod(userId: string) {
    const existing = await prisma.paymentMethod.findFirst({ where: { userId } });
    if (existing) return existing;

    return prisma.paymentMethod.create({
      data: {
        userId,
        provider: 'mock-stripe',
        providerPaymentMethodId: `pm_${userId.slice(-12)}`,
        brand: process.env.MOCK_PAYMENT_DEFAULT_BRAND ?? 'Visa',
        last4: process.env.MOCK_PAYMENT_DEFAULT_LAST4 ?? '4242',
        expiryMonth: 12,
        expiryYear: new Date().getFullYear() + 5,
        isDefault: true
      }
    });
  }
};
