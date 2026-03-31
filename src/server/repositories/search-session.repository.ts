import { prisma } from '@/lib/db/prisma';
import type { Prisma, SearchSessionKind, SearchSessionStatus } from '@prisma/client';

export const searchSessionRepository = {
  create(args: {
    tripRequestId: string;
    kind: SearchSessionKind;
    provider: string;
    requestPayload?: Prisma.InputJsonValue;
  }) {
    return prisma.providerSearchSession.create({
      data: {
        tripRequestId: args.tripRequestId,
        kind: args.kind,
        provider: args.provider,
        status: 'PENDING',
        requestPayload: args.requestPayload,
        startedAt: new Date()
      }
    });
  },

  updateStatus(id: string, status: SearchSessionStatus, responsePayload?: Prisma.InputJsonValue) {
    return prisma.providerSearchSession.update({
      where: { id },
      data: {
        status,
        responsePayload,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined
      }
    });
  }
};
