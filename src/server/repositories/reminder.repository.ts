import { ReminderStatus, ReminderType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const reminderRepository = {
  async createIfMissing(input: {
    bookingId: string;
    type: ReminderType;
    scheduledFor: Date;
    idempotencyKey: string;
  }) {
    return prisma.reminderJob.upsert({
      where: {
        bookingId_type: {
          bookingId: input.bookingId,
          type: input.type
        }
      },
      create: {
        bookingId: input.bookingId,
        type: input.type,
        scheduledFor: input.scheduledFor,
        idempotencyKey: input.idempotencyKey
      },
      update: {
        scheduledFor: input.scheduledFor,
        idempotencyKey: input.idempotencyKey
      }
    });
  },

  async claimDue(limit = 25) {
    const due = await prisma.reminderJob.findMany({
      where: {
        status: ReminderStatus.PENDING,
        scheduledFor: { lte: new Date() }
      },
      include: {
        booking: {
          include: {
            trip: true,
            user: true
          }
        }
      },
      orderBy: { scheduledFor: 'asc' },
      take: limit
    });

    const claimed = [] as typeof due;
    for (const job of due) {
      const result = await prisma.reminderJob.updateMany({
        where: { id: job.id, status: ReminderStatus.PENDING },
        data: { status: ReminderStatus.PROCESSING, attempts: { increment: 1 } }
      });
      if (result.count) {
        claimed.push(job);
      }
    }

    return claimed;
  },

  markSent(id: string) {
    return prisma.reminderJob.update({
      where: { id },
      data: { status: ReminderStatus.SENT, sentAt: new Date(), lastError: null }
    });
  },

  markSkipped(id: string, reason: string) {
    return prisma.reminderJob.update({
      where: { id },
      data: { status: ReminderStatus.SKIPPED, lastError: reason }
    });
  },

  markFailed(id: string, reason: string) {
    return prisma.reminderJob.update({
      where: { id },
      data: { status: ReminderStatus.FAILED, lastError: reason }
    });
  }
};
