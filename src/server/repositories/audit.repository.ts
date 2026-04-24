import { AuditActorType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const auditRepository = {
  log(input: {
    actorType: AuditActorType;
    action: string;
    userId?: string | null;
    tripId?: string | null;
    bookingId?: string | null;
    details?: Record<string, unknown> | null;
  }) {
    return prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        action: input.action,
        userId: input.userId ?? undefined,
        tripId: input.tripId ?? undefined,
        bookingId: input.bookingId ?? undefined,
        details: input.details ?? undefined
      }
    });
  }
};
