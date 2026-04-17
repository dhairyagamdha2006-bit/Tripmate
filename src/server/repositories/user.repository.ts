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

  getDefaultPaymentMethod(userId: string) {
    return prisma.paymentMethod.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    });
  },

  getPaymentMethodForUser(userId: string, paymentMethodId: string) {
    return prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId }
    });
  },

  listPaymentMethods(userId: string) {
    return prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    });
  }
};
