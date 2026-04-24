import { prisma } from '@/lib/db/prisma';

export const userRepository = {
  create(input: {
    email: string;
    passwordHash?: string;
    firstName: string;
    lastName: string;
  }) {
    return prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        name: [input.firstName, input.lastName].filter(Boolean).join(' ')
      }
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  }
};
